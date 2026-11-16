use serde::Deserialize;

#[derive(Deserialize)]
pub struct Archive {
    pub total: u32,
    #[serde(rename = "partSize")]
    pub part_size: u32,
    pub expands: Vec<Section>,
    #[serde(default)]
    pub colors: Vec<String>,
    #[serde(rename = "isTruecolor", default)]
    pub truecolor: bool,
    #[serde(rename = "completeSnapshots", default)]
    complete_snapshots: bool,
}

#[derive(Deserialize)]
pub struct Section {
    pub index: Range,
    pub part: Range,
    pub canvas: Option<Extent>,
    #[serde(default)]
    pub shift: Shift,
    pub colors: Option<Vec<String>>,
    #[serde(rename = "isTruecolor")]
    pub truecolor: Option<bool>,
}

#[derive(Deserialize)]
pub struct Extent {
    pub width: u32,
    pub height: u32,
}

#[derive(Default, Deserialize)]
#[serde(default)]
pub struct Shift {
    pub x: i32,
    pub y: i32,
}

#[derive(Deserialize)]
pub struct Range {
    from: u32,
    to: u32,
}

#[derive(serde::Serialize)]
pub struct Chunk {
    pub part: u32,
    pub offset: u32,
    pub section_start: u32,
    pub start: u32,
    pub end: u32,
    pub previous_pixel: Option<u32>,
    pub can_continue: bool,
}

impl Archive {
    pub fn markers(&self) -> Vec<f32> {
        let count = f64::from(self.total) + 1.0;
        self.expands
            .iter()
            .skip(1)
            .map(|section| (f64::from(section.index.from) / count) as f32)
            .collect()
    }

    pub fn chunk(&self, position: u32) -> Option<(&Section, Chunk)> {
        let section = self
            .expands
            .iter()
            .find(|section| (section.index.from..=section.index.to).contains(&position))?;
        let offset = position - section.index.from;
        let part = section
            .part
            .from
            .checked_add(offset.checked_div(self.part_size)?)?;
        if part > section.part.to {
            return None;
        }
        let offset = offset % self.part_size;
        let start = position - offset;
        Some((
            section,
            Chunk {
                part,
                offset,
                section_start: section.index.from,
                start,
                can_continue: start != section.index.from || section.canvas.as_ref()
                    .is_some_and(|canvas| canvas.width > 0 && canvas.height > 0),
                previous_pixel: (start > section.index.from && !self.complete_snapshots)
                    .then(|| start - 1),
                end: section
                    .index
                    .to
                    .min(start.saturating_add(self.part_size - 1)),
            },
        ))
    }

    pub fn decode(&self, position: u32, bytes: &[u8]) -> Option<Vec<Pixel>> {
        self.records(position, bytes)?.collect()
    }

    pub fn decode_last_pixel(&self, position: u32, bytes: &[u8]) -> Option<Pixel> {
        self.records(position, bytes)?.next_back()?
    }

    fn records<'a>(
        &'a self,
        position: u32,
        bytes: &'a [u8],
    ) -> Option<impl DoubleEndedIterator<Item = Option<Pixel>> + 'a> {
        let (section, chunk) = self.chunk(position)?;
        let truecolor = section.truecolor.unwrap_or(self.truecolor);
        let colors = section.colors.as_ref().unwrap_or(&self.colors);
        let size = if truecolor { 8 } else { 6 };
        let records = u64::from(chunk.end - chunk.start) + 1;
        if bytes.len() as u64 != records * size as u64 {
            return None;
        }
        Some(bytes.chunks_exact(size).map(move |record| {
            let word = |index| u16::from_le_bytes([record[index], record[index + 1]]);
            let (rgb, x, y) = if truecolor {
                (
                    (u32::from(word(0)) << 16) | u32::from(word(2)),
                    word(4),
                    word(6),
                )
            } else {
                let color = colors.get(usize::from(word(0)))?.strip_prefix('#')?;
                (u32::from_str_radix(color, 16).ok()?, word(2), word(4))
            };
            let [_, r, g, b] = rgb.to_be_bytes();
            Some(Pixel {
                x: i32::from(x),
                y: i32::from(y),
                color: [r, g, b],
            })
        }))
    }
}

#[derive(Clone, Copy)]
pub struct Pixel {
    pub x: i32,
    pub y: i32,
    pub color: [u8; 3],
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn handles_partial_chunk_at_expansion_and_decodes_both_formats() {
        let archive: Archive = serde_json::from_str(
            r##"{
            "total":6,"partSize":4,"colors":["#123456"],"expands":[
                {"index":{"from":0,"to":1},"part":{"from":0,"to":0}},
                {"index":{"from":2,"to":6},"part":{"from":1,"to":2},"isTruecolor":true}
            ]
        }"##,
        )
        .unwrap();
        assert_eq!(archive.markers(), vec![2.0 / 7.0]);
        assert_eq!(archive.chunk(1).unwrap().1.offset, 1);
        assert_eq!(archive.chunk(1).unwrap().1.end, 1);
        assert_eq!(archive.chunk(2).unwrap().1.part, 1);
        assert_eq!(archive.chunk(2).unwrap().1.end, 5);
        assert_eq!(archive.chunk(6).unwrap().1.section_start, 2);
        assert_eq!(archive.chunk(6).unwrap().1.start, 6);
        let indexed_record = [0, 0, 1, 0, 2, 0];
        assert!(archive.decode(0, &indexed_record).is_none());
        let indexed = archive.decode(0, &indexed_record.repeat(2)).unwrap();
        assert_eq!(indexed[0].color, [0x12, 0x34, 0x56]);
        let mut indexed_records = indexed_record.repeat(2);
        indexed_records[8] = 4;
        let last = archive.decode_last_pixel(1, &indexed_records).unwrap();
        assert_eq!((last.x, last.y, last.color), (4, 2, [0x12, 0x34, 0x56]));
        assert!(archive.decode_last_pixel(1, &indexed_record).is_none());
        let truecolor_record = [0xaa, 0, 0xcc, 0xbb, 2, 0, 3, 0];
        let truecolor = archive.decode(2, &truecolor_record.repeat(4)).unwrap();
        assert_eq!(truecolor[0].color, [0xaa, 0xbb, 0xcc]);
        assert_eq!((truecolor[0].x, truecolor[0].y), (2, 3));
        assert!(archive.decode(6, &truecolor_record).is_some());
        assert!(archive.decode(6, &truecolor_record.repeat(2)).is_none());
        assert!(archive.decode(2, &[0]).is_none());
    }

    #[test]
    fn sequential_playback_only_needs_geometry_at_an_expansion_boundary() {
        let archive: Archive = serde_json::from_str(
            r#"{
                "total":7,"partSize":2,"expands":[
                    {"index":{"from":0,"to":1},"part":{"from":0,"to":0}},
                    {"index":{"from":2,"to":5},"part":{"from":1,"to":2},
                        "canvas":{"width":20,"height":40},"shift":{"x":-3}},
                    {"index":{"from":6,"to":7},"part":{"from":3,"to":3}}
                ]
            }"#,
        )
        .unwrap();
        let (expansion, first) = archive.chunk(2).unwrap();
        assert!(first.can_continue);
        assert_eq!((expansion.shift.x, expansion.shift.y), (-3, 0));
        assert!(archive.chunk(4).unwrap().1.can_continue);
        assert!(!archive.chunk(6).unwrap().1.can_continue);
    }
}
