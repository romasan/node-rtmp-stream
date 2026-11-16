pub mod canvas;
pub mod game_clock;
#[cfg(any(target_arch = "wasm32", test))]
mod life;
pub mod palette_color;
pub mod protocol;
mod rich_text;
pub mod timelapse;
#[cfg(target_arch = "wasm32")]
mod web;

#[cfg(test)]
mod tests {
    use super::canvas::{Field, Geometry, Redraw};

    #[test]
    fn viewport_tiles_include_one_tile_margin_and_map_only_visible_rows() {
        let mut field = Field::default();
        field.begin(Geometry {
            width: 1280,
            height: 770,
            ..Geometry::default()
        });
        let center = field.viewport_tiles(512.0, 256.0, 768.0, 512.0);
        assert_eq!(center.indices().collect::<Vec<_>>(), [1, 2, 3, 6, 7, 8, 11, 12, 13]);
        assert_eq!(center.model_row(7), Some(4));
        assert_eq!(center.model_row(9), None);

        let edge = field.viewport_tiles(1024.0, 768.0, 1450.0, 930.0);
        assert_eq!(edge.indices().collect::<Vec<_>>(), [13, 14, 18, 19]);
        assert_eq!(edge.model_row(19), Some(3));
        assert_eq!(edge.model_row(12), None);
    }

    #[test]
    fn writes_batch_by_tile_and_copy_partial_edge_with_full_field_stride() {
        let mut field = Field::default();
        field.begin(Geometry {
            width: 258,
            height: 259,
            shift_x: 300,
            shift_y: -10,
            ..Geometry::default()
        });
        assert!(field.load(258, 259, vec![255; 258 * 259 * 4]));
        assert!(matches!(field.take_redraw(), Redraw::Snapshot));
        assert_eq!(field.tile_count(), 4);
        assert!(field.draw(-44, 267, [1, 2, 3]));
        assert!(field.draw(-43, 268, [4, 5, 6]));
        assert!(!field.draw(-43, 268, [4, 5, 6]));
        assert!(field.draw(-45, 268, [7, 8, 9]));
        let Redraw::Tiles(indices) = field.take_redraw() else {
            panic!("expected changed tiles")
        };
        assert_eq!(indices.into_iter().collect::<Vec<_>>(), [2, 3]);
        let tile = field.tile(3);
        assert_eq!((tile.x, tile.y, tile.width, tile.height), (256, 256, 2, 3));
        let mut rgba = [0; 24];
        field.copy_tile(&tile, &mut rgba);
        assert_eq!(rgba[8..12], [1, 2, 3, 255]);
        assert_eq!(rgba[20..], [4, 5, 6, 255]);
        assert!(matches!(field.take_redraw(), Redraw::None));
    }

    #[test]
    fn snapshots_replay_pending_pixels_in_arrival_order_and_apply_shifts() {
        let geometry = Geometry {
            width: 2,
            height: 1,
            shift_x: 1,
            ..Geometry::default()
        };
        let mut field = Field::default();
        field.begin(geometry);
        field.draw(-1, 0, [255, 0, 0]);
        field.draw(-1, 0, [0, 0, 255]);
        assert!(field.load(2, 1, vec![255; 8]));
        assert_eq!(field.pick(0, 0), Some([0, 0, 255]));
        assert_eq!(field.pick(1, 0), Some([255; 3]));
    }

    #[test]
    fn new_geometry_discards_pixels_from_previous_snapshot() {
        let mut field = Field::default();
        field.begin(Geometry {
            width: 1,
            height: 1,
            ..Geometry::default()
        });
        field.draw(0, 0, [0, 0, 0]);
        field.begin(Geometry {
            width: 2,
            height: 1,
            ..Geometry::default()
        });
        assert!(!field.load(1, 1, vec![255; 4]));
        assert!(field.load(2, 1, vec![255; 8]));
        assert_eq!(field.pick(0, 0), Some([255; 3]));
    }

    #[test]
    fn live_expansion_keeps_server_coordinates_and_crops_against_the_new_bounds() {
        let mut field = Field::default();
        field.begin(Geometry {
            width: 3,
            height: 3,
            shift_x: 4,
            shift_y: -2,
            ..Geometry::default()
        });
        assert!(field.load(3, 3, vec![255; 36]));
        assert!(field.draw(-3, 3, [100, 110, 120]));
        assert!(field.draw(-4, 3, [1, 2, 3]));
        assert!(field.expand(Geometry {
            width: 5,
            height: 4,
            shift_x: 3,
            shift_y: 0,
            ..Geometry::default()
        }));
        assert!(matches!(field.take_redraw(), Redraw::Snapshot));
        assert_eq!(field.server_coordinates(0, 3), Some((-3, 3)));
        assert_eq!(field.pick(0, 3), Some([100, 110, 120]));
        assert_eq!(field.pick(4, 0), Some([255; 3]));
        assert!(field.cell_coordinates(-4, 3).is_none());
        assert!(field.draw(1, 0, [50, 60, 70]));
        assert_eq!(field.pick(4, 0), Some([50, 60, 70]));
    }

    #[test]
    fn clicked_cell_round_trips_through_server_coordinates_with_both_shifts() {
        let mut field = Field::default();
        field.begin(Geometry {
            width: 5,
            height: 4,
            shift_x: 8,
            shift_y: -7,
            ..Geometry::default()
        });
        assert!(field.load(5, 4, vec![255; 80]));
        let (x, y) = field.server_coordinates(3, 2).unwrap();
        assert_eq!((x, y), (-5, 9));
        assert!(field.draw(x, y, [10, 20, 30]));
        assert_eq!(field.pick(3, 2), Some([10, 20, 30]));
        assert_eq!(field.server_coordinates(5, 2), None);
    }
}
