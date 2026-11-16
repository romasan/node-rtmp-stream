use crate::canvas::{Field, Geometry, Redraw};

const WHITE: [u8; 3] = [255; 3];

pub struct Life {
    pub field: Field,
    changes: Vec<(i32, i32, [u8; 3])>,
    running: bool,
}

impl Life {
    pub fn new(source: &Field) -> Self {
        let width = source.geometry.width;
        let height = source.geometry.height;
        let mut field = Field::default();
        field.begin(Geometry {
            width,
            height,
            ..Geometry::default()
        });
        field.load(width, height, source.pixels.clone());
        Self {
            field,
            changes: Vec::new(),
            running: true,
        }
    }

    pub fn advance(&mut self) -> Redraw {
        if !self.running {
            return Redraw::None;
        }
        let width = self.field.geometry.width as usize;
        let height = self.field.geometry.height as usize;
        let pixels = &self.field.pixels;
        for y in 0..height {
            let rows = [if y == 0 { height - 1 } else { y - 1 }, y, (y + 1) % height];
            for x in 0..width {
                let columns = [if x == 0 { width - 1 } else { x - 1 }, x, (x + 1) % width];
                let center = color_at(pixels, y * width + x);
                let mut count = 0;
                let mut blend = WHITE;
                for (row_index, row) in rows.into_iter().enumerate() {
                    for (column_index, column) in columns.into_iter().enumerate() {
                        if row_index == 1 && column_index == 1 {
                            continue;
                        }
                        let neighbor = color_at(pixels, row * width + column);
                        if neighbor != WHITE {
                            count += 1;
                            if count <= 3 {
                                blend = if count == 1 {
                                    neighbor
                                } else {
                                    std::array::from_fn(|i| {
                                        (u16::from(blend[i]) + u16::from(neighbor[i])).div_ceil(2) as u8
                                    })
                                };
                            }
                        }
                    }
                }
                let next = match (center == WHITE, count) {
                    (true, 3) => blend,
                    (false, 2 | 3) => center,
                    _ => WHITE,
                };
                if next != center {
                    self.changes.push((x as i32, y as i32, next));
                }
            }
        }
        self.running = !self.changes.is_empty();
        for (x, y, color) in self.changes.drain(..) {
            self.field.draw(x, y, color);
        }
        self.field.take_redraw()
    }
}

fn color_at(pixels: &[u8], index: usize) -> [u8; 3] {
    let offset = index * 4;
    [pixels[offset], pixels[offset + 1], pixels[offset + 2]]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn life_wraps_at_edges_and_blends_births_without_editing_the_source() {
        let mut field = Field::default();
        field.begin(Geometry {
            width: 4,
            height: 4,
            shift_x: 5,
            shift_y: -2,
            ..Geometry::default()
        });
        assert!(field.load(4, 4, vec![255; 64]));
        field.draw(-5, 2, [255, 0, 0]);
        field.draw(-2, 2, [0, 255, 0]);
        field.draw(-5, 5, [0, 0, 255]);

        let mut life = Life::new(&field);
        assert!(matches!(life.advance(), Redraw::Snapshot));
        assert_eq!(life.field.pick(3, 3), Some([128, 64, 64]));
        assert_eq!(life.field.pick(0, 0), Some([255, 0, 0]));
        assert_eq!(field.pick(3, 3), Some(WHITE));
    }
}
