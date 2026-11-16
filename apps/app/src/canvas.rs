use std::collections::{BTreeSet, HashMap};
use std::ops::Range;

pub const TILE_SIZE: u32 = 256;

pub struct Tile {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Default, PartialEq, Eq)]
pub struct TileRegion {
    columns: Range<usize>,
    rows: Range<usize>,
    stride: usize,
}

impl TileRegion {
    pub fn indices(&self) -> impl Iterator<Item = usize> + '_ {
        self.rows.clone().flat_map(move |row| {
            self.columns.clone().map(move |column| row * self.stride + column)
        })
    }

    pub fn model_row(&self, index: usize) -> Option<usize> {
        let row = index.checked_div(self.stride)?;
        let column = index % self.stride;
        if self.rows.contains(&row) && self.columns.contains(&column) {
            Some((row - self.rows.start) * self.columns.len() + column - self.columns.start)
        } else {
            None
        }
    }
}

pub enum Redraw {
    None,
    Snapshot,
    Tiles(BTreeSet<usize>),
}

use serde::Deserialize;

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Geometry {
    pub width: u32,
    pub height: u32,
    pub shift_x: i32,
    pub shift_y: i32,
    pub color_scheme: String,
}

#[derive(Default)]
pub struct Field {
    pub geometry: Geometry,
    pub pixels: Vec<u8>,
    // Only the last write to each cell matters while the snapshot is loading.
    pending: HashMap<(i32, i32), [u8; 3]>,
    snapshot_changed: bool,
    changed_tiles: BTreeSet<usize>,
}

impl Field {
    pub fn begin(&mut self, geometry: Geometry) {
        self.geometry = geometry;
        self.pixels.clear();
        self.pending.clear();
        self.snapshot_changed = false;
        self.changed_tiles.clear();
    }

    pub fn expand(&mut self, geometry: Geometry) -> bool {
        if self.pixels.is_empty() || geometry.width == 0 || geometry.height == 0 {
            return false;
        }
        if self.geometry == geometry {
            return true;
        }
        let Some(bytes) = (geometry.width as usize)
            .checked_mul(geometry.height as usize)
            .and_then(|cells| cells.checked_mul(4))
        else {
            return false;
        };
        let mut pixels = Vec::new();
        if pixels.try_reserve_exact(bytes).is_err() {
            return false;
        }
        pixels.resize(bytes, 255);

        let dx = i64::from(geometry.shift_x) - i64::from(self.geometry.shift_x);
        let dy = i64::from(geometry.shift_y) - i64::from(self.geometry.shift_y);
        let left = dx.max(0);
        let top = dy.max(0);
        let right = (dx + i64::from(self.geometry.width)).min(i64::from(geometry.width));
        let bottom = (dy + i64::from(self.geometry.height)).min(i64::from(geometry.height));
        if left < right && top < bottom {
            let row_bytes = (right - left) as usize * 4;
            for y in top..bottom {
                let source =
                    ((y - dy) as usize * self.geometry.width as usize + (left - dx) as usize) * 4;
                let target = (y as usize * geometry.width as usize + left as usize) * 4;
                pixels[target..target + row_bytes]
                    .copy_from_slice(&self.pixels[source..source + row_bytes]);
            }
        }
        self.begin(geometry);
        self.pixels = pixels;
        self.snapshot_changed = true;
        true
    }

    pub fn draw(&mut self, x: i32, y: i32, color: [u8; 3]) -> bool {
        let Some((x, y)) = self.cell_coordinates(x, y) else {
            return false;
        };
        let Some(offset) = self.offset(x, y) else {
            return false;
        };
        if self.pixels.is_empty() {
            self.pending.insert((x, y), color);
            return false;
        }
        let value = [color[0], color[1], color[2], 255];
        if self.pixels[offset..offset + 4] == value {
            return false;
        }
        self.pixels[offset..offset + 4].copy_from_slice(&value);
        if !self.snapshot_changed {
            let columns = self.geometry.width.div_ceil(TILE_SIZE);
            let index = (y as u32 / TILE_SIZE) * columns + x as u32 / TILE_SIZE;
            self.changed_tiles.insert(index as usize);
        }
        true
    }

    pub fn load(&mut self, width: u32, height: u32, rgba: Vec<u8>) -> bool {
        if width == 0
            || height == 0
            || width != self.geometry.width
            || height != self.geometry.height
            || (width as usize)
                .checked_mul(height as usize)
                .and_then(|n| n.checked_mul(4))
                != Some(rgba.len())
        {
            return false;
        }
        self.pixels = rgba;
        self.snapshot_changed = true;
        self.changed_tiles.clear();
        for ((x, y), color) in std::mem::take(&mut self.pending) {
            if let Some(offset) = self.offset(x, y) {
                self.pixels[offset..offset + 4]
                    .copy_from_slice(&[color[0], color[1], color[2], 255]);
            }
        }
        true
    }

    pub fn take_redraw(&mut self) -> Redraw {
        if std::mem::take(&mut self.snapshot_changed) {
            Redraw::Snapshot
        } else if self.changed_tiles.is_empty() {
            Redraw::None
        } else {
            Redraw::Tiles(std::mem::take(&mut self.changed_tiles))
        }
    }

    pub fn tile_count(&self) -> usize {
        self.geometry.width.div_ceil(TILE_SIZE) as usize
            * self.geometry.height.div_ceil(TILE_SIZE) as usize
    }

    pub fn viewport_tiles(&self, left: f32, top: f32, right: f32, bottom: f32) -> TileRegion {
        fn with_margin(start: f32, end: f32, count: usize) -> Range<usize> {
            let first = ((start / TILE_SIZE as f32).floor() as usize).saturating_sub(1);
            let past_last = ((end / TILE_SIZE as f32).ceil() as usize).saturating_add(1);
            first.min(count)..past_last.min(count)
        }

        let stride = self.geometry.width.div_ceil(TILE_SIZE) as usize;
        let rows = self.geometry.height.div_ceil(TILE_SIZE) as usize;
        TileRegion {
            columns: with_margin(left, right, stride),
            rows: with_margin(top, bottom, rows),
            stride,
        }
    }

    pub fn tile(&self, index: usize) -> Tile {
        let columns = self.geometry.width.div_ceil(TILE_SIZE) as usize;
        let x = (index % columns) as u32 * TILE_SIZE;
        let y = (index / columns) as u32 * TILE_SIZE;
        Tile {
            x,
            y,
            width: TILE_SIZE.min(self.geometry.width - x),
            height: TILE_SIZE.min(self.geometry.height - y),
        }
    }

    pub fn copy_tile(&self, tile: &Tile, destination: &mut [u8]) {
        let row_bytes = tile.width as usize * 4;
        for (dy, row) in destination.chunks_exact_mut(row_bytes).enumerate() {
            let offset =
                ((tile.y as usize + dy) * self.geometry.width as usize + tile.x as usize) * 4;
            row.copy_from_slice(&self.pixels[offset..offset + row_bytes]);
        }
    }

    pub fn pick(&self, x: i32, y: i32) -> Option<[u8; 3]> {
        let offset = self.offset(x, y)?;
        self.pixels.get(offset..offset + 3)?.try_into().ok()
    }

    pub fn cell_coordinates(&self, x: i32, y: i32) -> Option<(i32, i32)> {
        let x = x.checked_add(self.geometry.shift_x)?;
        let y = y.checked_add(self.geometry.shift_y)?;
        self.offset(x, y)?;
        Some((x, y))
    }

    pub fn server_coordinates(&self, x: i32, y: i32) -> Option<(i32, i32)> {
        self.offset(x, y)?;
        Some((
            x.checked_sub(self.geometry.shift_x)?,
            y.checked_sub(self.geometry.shift_y)?,
        ))
    }

    pub fn offset(&self, x: i32, y: i32) -> Option<usize> {
        let (x, y) = (u32::try_from(x).ok()?, u32::try_from(y).ok()?);
        if x >= self.geometry.width || y >= self.geometry.height {
            return None;
        }
        (y as usize)
            .checked_mul(self.geometry.width as usize)?
            .checked_add(x as usize)?
            .checked_mul(4)
    }
}

pub fn decode_png(bytes: &[u8]) -> Result<(u32, u32, Vec<u8>), png::DecodingError> {
    let mut decoder = png::Decoder::new(std::io::Cursor::new(bytes));
    decoder.set_transformations(png::Transformations::normalize_to_color8());
    let mut reader = decoder.read_info()?;
    let mut buffer = vec![
        0;
        reader
            .output_buffer_size()
            .ok_or(png::DecodingError::LimitsExceeded)?
    ];
    let info = reader.next_frame(&mut buffer)?;
    buffer.truncate(info.buffer_size());
    let rgba = match info.color_type {
        png::ColorType::Rgba => buffer,
        png::ColorType::Rgb => buffer
            .chunks_exact(3)
            .flat_map(|p| [p[0], p[1], p[2], 255])
            .collect(),
        png::ColorType::GrayscaleAlpha => buffer
            .chunks_exact(2)
            .flat_map(|p| [p[0], p[0], p[0], p[1]])
            .collect(),
        png::ColorType::Grayscale => buffer.into_iter().flat_map(|v| [v, v, v, 255]).collect(),
        png::ColorType::Indexed => unreachable!("indexed PNG is expanded by the decoder"),
    };
    Ok((info.width, info.height, rgba))
}
