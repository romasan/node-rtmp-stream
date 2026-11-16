use std::{cell::RefCell, rc::Rc};

use slint::private_unstable_api::re_exports::{StyledText, string_to_styled_text};
use slint::{
    ComponentHandle, Image, Model, ModelRc, Rgba8Pixel, SharedPixelBuffer, Timer, VecModel,
};
use wasm_bindgen::prelude::*;

use crate::{
    canvas::{Field, Geometry, Redraw, TileRegion, decode_png},
    protocol::{self, Chat, Event},
    timelapse::{Archive, Pixel},
};

slint::include_modules!();

#[derive(serde::Deserialize)]
struct ChatDisplay {
    day: String,
    time: String,
    text: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Statistics {
    total: String,
    online_count: i32,
    leaderboard: Vec<StatisticPlayer>,
    online_list: Vec<StatisticPlayer>,
}

#[derive(serde::Deserialize)]
struct StatisticPlayer {
    name: String,
    area: String,
    #[serde(default)]
    count: String,
    #[serde(default)]
    place: String,
}

impl From<StatisticPlayer> for PlayerRow {
    fn from(player: StatisticPlayer) -> Self {
        Self {
            name: player_name(&player.name).into(),
            area: player.area.into(),
            count: player.count.into(),
            place: player.place.into(),
        }
    }
}

fn player_name(name: &str) -> &str {
    if name == "ㅤ" {
        "типа самый умный"
    } else {
        name
    }
}

fn mentions(text: &str, nickname: &str) -> bool {
    !nickname.is_empty()
        && text
            .to_lowercase()
            .contains(&format!("@{}", nickname.to_lowercase()))
}

#[wasm_bindgen(raw_module = "./bridge.js")]
extern "C" {
    fn snapshot();
    #[wasm_bindgen(js_name = updatePalette)]
    fn update_palette();
    fn session_initialized();
    fn navigate(path: &str);
    fn open_finish_link(url: &str);
    fn place_pixel(x: i32, y: i32, color: &str);
    fn inspect_pixel(x: i32, y: i32, finished: bool);
    fn cancel_pixel_inspection();
    fn save_color(slot: &str, color: &str);
    fn delete_color(slot: &str);
    fn history();
    fn stats();
    fn cancel_stats();
    fn post_message(text: &str);
    fn forget_message_submission();
    fn open_chat_link(url: &str);
    fn chat_display(time: f64, text: &str) -> String;
    fn telegram_auth();
    fn select_season(index: i32);
    fn replay_seek(position: f32);
    fn replay_toggle();
    fn replay_speed(factor: f32);
    fn replay_toggle_position();
    fn position_native_season_picker(left: f32, top: f32, width: f32, height: f32, visible: bool);
    fn set_field_cursor(cursor: &str);
}

#[derive(Default)]
struct State {
    field: Field,
    offline_field: Option<Field>,
    life: Option<crate::life::Life>,
    live_expansion: bool,
    tiles: Rc<VecModel<FieldTile>>,
    tile_region: TileRegion,
    cooldown: f64,
    cooldown_duration: f64,
    finish: Option<f64>,
    need_authorize: bool,
    messages: Vec<Chat>,
    archive: Option<Archive>,
    replay_pixels: Vec<Pixel>,
    replay_chunk_end: Option<u32>,
    replay_cursor: usize,
    inspected_cell: Option<(i32, i32, bool)>,
    placement_started: Option<f64>,
}

#[wasm_bindgen]
pub struct Client {
    ui: App,
    state: Rc<RefCell<State>>,
    _timer: Timer,
}

#[wasm_bindgen]
impl Client {
    #[wasm_bindgen(constructor)]
    pub fn new(telegram: bool, replay: bool, local: bool) -> Result<Client, JsValue> {
        let error = |error: slint::PlatformError| JsValue::from_str(&error.to_string());
        let backend = i_slint_backend_winit::Backend::builder()
            .with_renderer_name("femtovg")
            .with_spawn_event_loop(true)
            .build()
            .map_err(error)?;
        slint::platform::set_platform(Box::new(backend))
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let ui = App::new().map_err(error)?;
        ui.set_telegram(telegram);
        ui.set_local(local);
        ui.set_replay(replay);
        ui.on_season(select_season);
        ui.on_seek(replay_seek);
        ui.on_play(replay_toggle);
        ui.on_speed(replay_speed);
        ui.on_toggle_replay_position(replay_toggle_position);
        ui.on_position_native_season_picker(position_native_season_picker);
        ui.on_field_cursor_changed(|cursor| set_field_cursor(cursor.as_str()));
        ui.on_navigate(|path| navigate(path.as_str()));
        ui.on_finish_link(|url| open_finish_link(url.as_str()));
        ui.on_show_chat(history);
        ui.on_hide_chat(forget_message_submission);
        ui.on_chat_link(|url| open_chat_link(url.as_str()));
        ui.on_show_stats(stats);
        ui.on_hide_stats(cancel_stats);
        let color_ui = ui.as_weak();
        ui.on_open_color(move |slot| {
            let Some(ui) = color_ui.upgrade() else { return };
            use slint::Model;
            let rgb = ui
                .get_palette()
                .iter()
                .find(|swatch| swatch.slot == slot)
                .map_or_else(
                    || (js_sys::Math::random() * 16_777_216.0) as u32,
                    |swatch| {
                        u32::from_be_bytes([
                            0,
                            swatch.rgb.red(),
                            swatch.rgb.green(),
                            swatch.rgb.blue(),
                        ])
                    },
                );
            ui.set_editor_slot(slot);
            set_editor_color(&ui, rgb);
            ui.set_picking(false);
            ui.set_panel(5);
            ui.invoke_raise_editor();
        });
        let color_ui = ui.as_weak();
        ui.on_edit_hex(move |text| {
            let Some(ui) = color_ui.upgrade() else { return };
            if let Some(rgb) = crate::palette_color::parse_hex(text.as_str()) {
                update_editor_preview(&ui, rgb);
            }
        });
        let color_ui = ui.as_weak();
        ui.on_adjust_color(move |hue, saturation, value| {
            let Some(ui) = color_ui.upgrade() else { return };
            let rgb = crate::palette_color::rgb(hue, saturation, value);
            ui.set_editor_hue(hue);
            ui.set_editor_saturation(saturation);
            ui.set_editor_value(value);
            ui.set_editor_hue_color(slint_rgb(crate::palette_color::rgb(hue, 1.0, 1.0)));
            ui.set_editor_color(slint_rgb(rgb));
            ui.set_editor_hex(format!("#{rgb:06x}").into());
        });
        let color_ui = ui.as_weak();
        ui.on_commit_hex(move || {
            let Some(ui) = color_ui.upgrade() else { return };
            ui.set_editor_hex(format_color(ui.get_editor_color()).into());
        });
        let color_ui = ui.as_weak();
        ui.on_custom_color(move || {
            let Some(ui) = color_ui.upgrade() else { return };
            let sample = ui.get_editor_color();
            let color = format_color(sample);
            ui.set_selected(color.clone().into());
            ui.set_selected_rgb(sample);
            save_color(ui.get_editor_slot().as_str(), &color);
            ui.set_picking(false);
            ui.set_panel(0);
        });
        let color_ui = ui.as_weak();
        ui.on_delete_color(move || {
            let Some(ui) = color_ui.upgrade() else { return };
            delete_color(ui.get_editor_slot().as_str());
            ui.set_picking(false);
            ui.set_panel(0);
        });
        let chat_ui = ui.as_weak();
        ui.on_send_message(move |text| {
            let Some(ui) = chat_ui.upgrade() else { return };
            if !text.is_empty() && !ui.get_chat_sending() {
                ui.set_chat_sending(true);
                post_message(text.as_str());
            }
        });
        let state = Rc::new(RefCell::new(State::default()));
        ui.set_field_tiles(ModelRc::from(state.borrow().tiles.clone()));
        let pixel_state = state.clone();
        let pixel_ui = ui.as_weak();
        ui.on_select_pixel(move |x, y, picking, selected| {
            let Some(ui) = pixel_ui.upgrade() else { return };
            let state = pixel_state.borrow();
            let Some(color) = state.field.pick(x, y) else {
                return;
            };
            if picking {
                if ui.get_panel() == 5 {
                    set_editor_color(&ui, u32::from_be_bytes([0, color[0], color[1], color[2]]));
                    return;
                }
                let key = if state.field.geometry.color_scheme == "truecolor" {
                    Some(format!("#{:02x}{:02x}{:02x}", color[0], color[1], color[2]))
                } else {
                    use slint::Model;
                    ui.get_palette()
                        .iter()
                        .find(|swatch| {
                            let rgb = swatch.rgb;
                            [rgb.red(), rgb.green(), rgb.blue()] == color
                        })
                        .map(|swatch| swatch.key.to_string())
                };
                if let Some(key) = key {
                    ui.set_selected(key.into());
                    ui.set_selected_rgb(slint::Color::from_rgb_u8(color[0], color[1], color[2]));
                }
            } else if state.need_authorize && !ui.get_authorized() && !ui.get_telegram() {
                ui.set_panel(1);
            } else if !ui.get_paused()
                && !selected.is_empty()
                && state.cooldown <= js_sys::Date::now()
                && state
                    .finish
                    .is_none_or(|finish| finish > js_sys::Date::now())
            {
                if let Some((x, y)) = state.field.server_coordinates(x, y) {
                    place_pixel(x, y, selected.as_str());
                }
            }
        });
        let timer = Timer::default();
        let tick_ui = ui.as_weak();
        let tick_state = state.clone();
        timer.start(
            slint::TimerMode::Repeated,
            std::time::Duration::from_millis(16),
            move || {
                let Some(ui) = tick_ui.upgrade() else { return };
                let mut state = tick_state.borrow_mut();
                let redraw = state.field.take_redraw();
                if matches!(redraw, Redraw::Snapshot) {
                    state.life = None;
                    state.offline_field = None;
                    let width = state.field.geometry.width as f32;
                    let height = state.field.geometry.height as f32;
                    if std::mem::take(&mut state.live_expansion) {
                        ui.invoke_preserve_field_origin(width, height);
                    }
                    ui.set_field_width(width);
                    ui.set_field_height(height);
                    ui.set_ready(true);
                    ui.set_snapshot_error(false);
                    if !replay {
                        ui.set_connected(true);
                    }
                }
                let redraw = state.life.as_mut().map_or(redraw, |life| life.advance());
                if ui.get_ready() || state.offline_field.is_some() {
                    update_visible_tiles(&ui, &mut state, redraw);
                }
                if replay {
                    return;
                }
                let now = js_sys::Date::now();
                if let Some(started) = state.placement_started {
                    let progress = ((now - started) / 300.0).clamp(0.0, 1.0) as f32;
                    ui.set_placement_progress(progress);
                    if progress == 1.0 {
                        state.placement_started = None;
                    }
                }
                let remaining = state.finish.map(|finish| finish - now);
                let finished = remaining.is_some_and(|remaining| remaining <= 0.0);
                if ui.get_finished() != finished {
                    ui.set_finished(finished);
                }
                update_pixel_preview(&ui, &mut state);

                let season = remaining
                    .filter(|remaining| *remaining > 0.0)
                    .map_or_else(String::new, |remaining| {
                        crate::game_clock::season_label((remaining / 1000.0) as u64)
                    });
                if ui.get_season_clock().as_str() != season {
                    ui.set_season_clock(season.into());
                }

                let remaining = (state.cooldown - now).max(0.0);
                let progress = if remaining > 0.0 && state.cooldown_duration > 0.0 {
                    (1.0 - remaining / state.cooldown_duration).clamp(0.0, 1.0) as f32
                } else {
                    0.0
                };
                if ui.get_cooldown_progress() != progress {
                    ui.set_cooldown_progress(progress);
                }
                let cooldown = if remaining > 0.0 {
                    crate::game_clock::cooldown_label((remaining / 1000.0).ceil() as u64)
                } else {
                    String::new()
                };
                if ui.get_cooldown_clock().as_str() != cooldown {
                    ui.set_cooldown_clock(cooldown.into());
                }
            },
        );
        ui.show().map_err(error)?;
        slint::run_event_loop().map_err(error)?;
        Ok(Self {
            ui,
            state,
            _timer: timer,
        })
    }

    pub fn binary(&self, bytes: &[u8]) {
        self.event(protocol::binary(bytes));
    }

    pub fn text(&self, frame: &str) {
        self.event(protocol::text(frame));
    }

    pub fn load_snapshot(&self, bytes: &[u8]) -> Result<bool, JsValue> {
        let (width, height, rgba) =
            decode_png(bytes).map_err(|error| JsValue::from_str(&error.to_string()))?;
        let mut state = self.state.borrow_mut();
        Ok(state.field.load(width, height, rgba))
    }

    pub fn disconnected(&self) {
        self.ui.set_connected(false);
        self.ui.set_status("Переподключение…".into());
        if self.ui.get_replay() {
            return;
        }
        let mut state = self.state.borrow_mut();
        if state.life.take().is_some() {
            state.tile_region = TileRegion::default();
        }
        if self.ui.get_ready() {
            state.offline_field = Some(std::mem::take(&mut state.field));
        } else {
            state.field.begin(Default::default());
        }
        state.live_expansion = false;
        state.cooldown = 0.0;
        state.placement_started = None;
        self.ui.set_placement_progress(1.0);
        state.inspected_cell = None;
        self.ui.set_cell_details(PixelDetails::default());
        self.ui.set_ready(false);
    }

    pub fn start_life(&self) {
        if self.ui.get_replay() || !self.ui.get_ready() {
            return;
        }
        let mut state = self.state.borrow_mut();
        state.life = Some(crate::life::Life::new(&state.field));
    }

    pub fn snapshot_failed(&self) {
        if self.state.borrow().offline_field.is_none() {
            self.ui.set_snapshot_error(true);
        }
    }

    pub fn status(&self, status: &str) {
        self.ui.set_status(status.into());
    }

    pub fn stats_status(&self, text: &str) {
        self.ui.set_stats(text.into());
    }

    pub fn load_stats(&self, json: &str) -> bool {
        let Ok(stats) = serde_json::from_str::<Statistics>(json) else {
            return false;
        };
        let to_rows = |players: Vec<StatisticPlayer>| {
            ModelRc::new(VecModel::from(
                players.into_iter().map(PlayerRow::from).collect::<Vec<_>>(),
            ))
        };
        self.ui.set_total_pixels(stats.total.into());
        self.ui.set_online_count(stats.online_count);
        self.ui.set_leaders(to_rows(stats.leaderboard));
        self.ui.set_online_players(to_rows(stats.online_list));
        self.ui.set_stats("".into());
        true
    }

    pub fn chat_result(&self, submitted: &str, error: &str) {
        self.ui.set_chat_sending(false);
        if error.is_empty() && self.ui.get_chat_draft().as_str() == submitted {
            self.ui.set_chat_draft("".into());
        }
    }

    pub fn moderator(&self, moderator: bool) {
        self.ui.set_moderator(moderator);
    }

    pub fn resize(&self, width: f32, height: f32, dpr: f32) {
        let window = self.ui.window();
        // Lay out in CSS pixels and render at the display's physical resolution.
        if window.scale_factor() != dpr {
            window.dispatch_event(slint::platform::WindowEvent::ScaleFactorChanged {
                scale_factor: dpr,
            });
        }
        let size = slint::LogicalSize::new(width, height);
        window.set_size(size.to_physical(dpr));
        window.dispatch_event(slint::platform::WindowEvent::Resized { size });
    }

    pub fn pixel_placed(&self, x: i32, y: i32, color: &str) {
        if !self.ui.get_mobile() || !self.ui.get_ready() {
            return;
        }
        let mut state = self.state.borrow_mut();
        let Some((x, y)) = state.field.cell_coordinates(x, y) else {
            return;
        };
        let rgb = color
            .strip_prefix('#')
            .and_then(|hex| u32::from_str_radix(hex, 16).ok());
        let Some([_, r, g, b]) = rgb.map(u32::to_be_bytes) else {
            return;
        };
        self.ui.set_placement_x(x as f32);
        self.ui.set_placement_y(y as f32);
        self.ui
            .set_placement_color(slint::Color::from_rgb_u8(r, g, b));
        self.ui.set_placement_progress(0.0);
        state.placement_started = Some(js_sys::Date::now());
    }

    pub fn palette_hold(&self, x: f32, y: f32) -> bool {
        self.ui.invoke_palette_hold(x, y)
    }

    pub fn scroll_palette(&self, x: f32, y: f32, delta: f32) -> bool {
        self.ui.invoke_scroll_palette(x, y, delta)
    }

    pub fn point_at(&self, x: f32, y: f32, active: bool) {
        self.ui.set_pointer_x(x);
        self.ui.set_pointer_y(y);
        self.ui.set_hover_active(active);
    }

    pub fn pixel_details(
        &self,
        x: i32,
        y: i32,
        finished: bool,
        label: &str,
        area: &str,
        time: &str,
        color: &str,
    ) {
        if self.state.borrow().inspected_cell == Some((x, y, finished)) {
            let rgb = crate::palette_color::parse_hex(color);
            self.ui.set_cell_details(PixelDetails {
                label: player_name(label).into(),
                area: area.into(),
                time: time.into(),
                color_label: if rgb.is_some() {
                    color.into()
                } else {
                    "".into()
                },
                swatch: rgb.map(slint_rgb).unwrap_or_default(),
            });
        }
    }

    pub fn field_area(&self, x: f32, y: f32) -> bool {
        self.ui.invoke_field_area(x, y)
    }

    pub fn board_contains(&self, x: f32, y: f32) -> bool {
        self.ui.invoke_board_contains(x, y)
    }

    pub fn activate_window_at(&self, x: f32, y: f32) {
        self.ui.invoke_activate_window_at(x, y);
    }

    pub fn set_layout(&self, mobile: bool, season_label: &str) {
        self.ui.set_mobile(mobile);
        self.ui.set_season_label(season_label.into());
    }

    pub fn viewport_width(&self) -> f32 {
        self.ui.get_viewport_width()
    }

    pub fn viewport_height(&self) -> f32 {
        self.ui.get_viewport_height()
    }

    pub fn move_field(&self, x: f32, y: f32, dx: f32, dy: f32, factor: f32) {
        self.ui.invoke_reposition(x, y, dx, dy, factor);
    }

    pub fn wheel_zoom(&self, x: f32, y: f32, factor: f32) {
        self.ui.invoke_wheel_zoom(x, y, factor);
    }

    pub fn canvas_click(&self, x: f32, y: f32, touch: bool) {
        self.ui.invoke_choose(x, y, touch);
    }

    pub fn scheme(&self) -> String {
        self.state.borrow().field.geometry.color_scheme.clone()
    }

    pub fn set_palette(&self, json: &str, initial_color: &str) {
        let Ok(items) = serde_json::from_str::<Vec<(String, String)>>(json) else {
            return;
        };
        let swatches: Vec<_> = items
            .into_iter()
            .filter_map(|(slot, value)| {
                let [_, r, g, b] = u32::from_str_radix(value.strip_prefix('#')?, 16)
                    .ok()?
                    .to_be_bytes();
                Some(Swatch {
                    key: if self.ui.get_truecolor() {
                        value.to_ascii_lowercase().into()
                    } else {
                        slot.clone().into()
                    },
                    slot: slot.into(),
                    rgb: slint::Color::from_rgb_u8(r, g, b),
                })
            })
            .collect();
        let selected = self.ui.get_selected();
        let custom_color = self.ui.get_truecolor() && selected.starts_with('#');
        if !custom_color && !swatches.iter().any(|swatch| swatch.key == selected) {
            if let Some(rgb) = crate::palette_color::parse_hex(initial_color) {
                self.ui.set_selected(format!("#{rgb:06x}").into());
                self.ui.set_selected_rgb(slint_rgb(rgb));
            } else if let Some(swatch) = swatches
                .iter()
                .find(|s| s.key == "black")
                .or(swatches.last())
            {
                self.ui.set_selected(swatch.key.clone());
                self.ui.set_selected_rgb(swatch.rgb);
            } else {
                self.ui.set_selected("".into());
            }
        }
        self.ui.set_palette(ModelRc::new(VecModel::from(swatches)));
    }

    pub fn set_seasons(&self, json: &str) {
        if let Ok(seasons) = serde_json::from_str::<Vec<(String, i32)>>(json) {
            self.ui.set_seasons(ModelRc::new(VecModel::from(
                seasons
                    .into_iter()
                    .map(|(label, group)| SeasonOption {
                        label: label.into(),
                        group,
                    })
                    .collect::<Vec<_>>(),
            )));
        }
    }

    pub fn load_archive(&self, json: &str) -> bool {
        let Ok(archive) = serde_json::from_str::<Archive>(json) else {
            return false;
        };
        if archive.part_size == 0 || archive.chunk(0).is_none() {
            return false;
        }
        self.ui
            .set_replay_markers(ModelRc::new(VecModel::from(archive.markers())));
        self.state.borrow_mut().archive = Some(archive);
        true
    }

    pub fn replay_chunk(&self, position: u32) -> Option<String> {
        let state = self.state.borrow();
        let (_, chunk) = state.archive.as_ref()?.chunk(position)?;
        serde_json::to_string(&chunk).ok()
    }

    pub fn load_replay_chunk(
        &self,
        position: u32,
        png: &[u8],
        bytes: &[u8],
        previous_bytes: &[u8],
        recenter: bool,
    ) -> bool {
        let Ok((width, height, rgba)) = decode_png(png) else {
            return false;
        };
        let mut state = self.state.borrow_mut();
        let Some(archive) = &state.archive else {
            return false;
        };
        let Some((_, chunk)) = archive.chunk(position) else {
            return false;
        };
        let Some(pixels) = archive.decode(position, bytes) else {
            return false;
        };
        // Packed previews within a section can precede the previous part's final update.
        let mut previous_tail = None;
        if let Some(previous_position) = chunk.previous_pixel {
            previous_tail = if state.replay_chunk_end == Some(previous_position) {
                state.replay_pixels.last().copied()
            } else {
                archive.decode_last_pixel(previous_position, previous_bytes)
            };
            if previous_tail.is_none() {
                return false;
            }
        }
        state.field.begin(Geometry {
            width,
            height,
            ..Geometry::default()
        });
        if !state.field.load(width, height, rgba) {
            return false;
        }
        if let Some(Pixel { x, y, color }) = previous_tail {
            state.field.draw(x, y, color);
        }
        state.replay_pixels = pixels;
        state.replay_chunk_end = Some(chunk.end);
        state.replay_cursor = 0;
        if recenter {
            self.ui.invoke_center_replay_field();
        }
        true
    }

    pub fn advance_replay(&self, count: usize) {
        let mut state = self.state.borrow_mut();
        let end = count.min(state.replay_pixels.len());
        for index in state.replay_cursor..end {
            let Pixel { x, y, color } = state.replay_pixels[index];
            state.field.draw(x, y, color);
        }
        state.replay_cursor = end;
    }

    pub fn continue_replay(&self, position: u32, bytes: &[u8]) -> bool {
        let mut state = self.state.borrow_mut();
        let Some(archive) = state.archive.as_ref() else {
            return false;
        };
        let Some((section, chunk)) = archive.chunk(position) else {
            return false;
        };
        if !chunk.can_continue
            || state.replay_chunk_end != chunk.start.checked_sub(1)
            || state.replay_cursor != state.replay_pixels.len()
            || state.field.pixels.is_empty()
        {
            return false;
        }
        let Some(pixels) = archive.decode(position, bytes) else {
            return false;
        };
        if chunk.start == chunk.section_start {
            let Some(canvas) = &section.canvas else {
                return false;
            };
            // The archive stores part coordinates relative to each canvas.
            // Apply the expansion delta to the old image before updating pixels.
            let geometry = Geometry {
                width: canvas.width,
                height: canvas.height,
                shift_x: section.shift.x,
                shift_y: section.shift.y,
                ..Geometry::default()
            };
            if !state.field.expand(geometry) {
                return false;
            }
            state.field.geometry.shift_x = 0;
            state.field.geometry.shift_y = 0;
            self.ui.invoke_center_replay_field();
        }
        state.replay_pixels = pixels;
        state.replay_chunk_end = Some(chunk.end);
        state.replay_cursor = 0;
        true
    }

    pub fn replay_key(&self) -> bool {
        self.ui.invoke_replay_key()
    }

    pub fn replay_selected(&self, index: i32) {
        let mut state = self.state.borrow_mut();
        state.archive = None;
        state.replay_pixels.clear();
        state.replay_chunk_end = None;
        state.replay_cursor = 0;
        state.field.begin(Geometry::default());
        state.tiles.set_vec(Vec::new());
        state.tile_region = TileRegion::default();
        self.ui.set_field_width(0.0);
        self.ui.set_field_height(0.0);
        self.ui.set_ready(false);
        self.ui.set_replay_markers(ModelRc::default());
        self.ui.set_replay_season(index);
    }

    pub fn replay_state(&self, loaded: bool, status: &str, retryable: bool) {
        self.ui.set_replay_loaded(loaded);
        self.ui.set_replay_status(status.into());
        self.ui.set_replay_retryable(retryable);
    }

    pub fn replay_display(&self, progress: f32, position: &str, speed: &str) {
        self.ui.set_replay_progress(progress);
        self.ui.set_replay_position(position.into());
        self.ui.set_replay_speed(speed.into());
    }

    pub fn playing(&self, value: bool) {
        self.ui.set_playing(value);
    }

    pub fn merge_history(&self, json: &str) {
        let Ok(mut history) = serde_json::from_str::<Vec<Chat>>(json) else {
            return;
        };
        let mut state = self.state.borrow_mut();
        for message in state.messages.drain(..) {
            if !history.iter().any(|old| old.matches(&message)) {
                history.push(message);
            }
        }
        history.sort_by_key(|message| message.time);
        state.messages = history;
        self.update_chat(&mut state);
    }
}

impl Client {
    fn event(&self, event: Option<Event>) {
        let Some(event) = event else { return };
        let mut state = self.state.borrow_mut();
        let geometry = match event {
            Event::Init(session) => {
                self.ui.set_authorized(session.is_authorized);
                let nickname_changed = self.ui.get_user_name().as_str() != session.name;
                self.ui.set_user_name(session.name.into());
                if nickname_changed {
                    self.update_chat(&mut state);
                }
                session_initialized();
                if self.ui.get_replay() {
                    self.ui.set_connected(true);
                    return;
                }
                state.need_authorize = session.need_authorize;
                self.ui.set_paused(session.paused);
                let now = js_sys::Date::now();
                state.cooldown_duration = f64::from(session.countdown);
                state.cooldown = now + state.cooldown_duration;
                state.finish = session.finish.map(|time| now + time as f64);
                self.ui.set_has_deadline(state.finish.is_some());
                let text = if session.finish_text.is_empty() {
                    "TIMEOUT"
                } else {
                    &session.finish_text
                };
                let markdown = crate::game_clock::finish_markdown(text);
                self.ui.set_finish_message(
                    StyledText::parse_interpolated::<StyledText>(&markdown, &[])
                        .unwrap_or_else(|_| string_to_styled_text(text.to_owned())),
                );
                if self.ui.get_telegram() && session.need_authorize && !session.is_authorized {
                    telegram_auth();
                }
                // The server can broadcast init to other tabs of the same session.
                // Their current snapshot and buffered updates still belong to this geometry.
                if state.field.geometry == session.canvas {
                    return;
                }
                session.canvas
            }
            Event::Expand(geometry) => {
                let previous = &state.field.geometry;
                if self.ui.get_replay() || *previous == geometry {
                    return;
                }
                // A same-size PNG may already include the new shift if HTTP
                // delivered it before the WebSocket expansion event.
                let shift_without_resize = previous.width == geometry.width
                    && previous.height == geometry.height
                    && (previous.shift_x != geometry.shift_x || previous.shift_y != geometry.shift_y);
                let was_ready = self.ui.get_ready();
                state.live_expansion |= was_ready;
                if !shift_without_resize && state.field.expand(geometry.clone()) {
                    self.ui
                        .set_truecolor(state.field.geometry.color_scheme == "truecolor");
                    self.ui.set_ready(false);
                    self.ui.set_placement_progress(1.0);
                    state.placement_started = None;
                    drop(state);
                    update_palette();
                    return;
                }
                if was_ready {
                    state.offline_field = Some(std::mem::take(&mut state.field));
                }
                geometry
            }
            Event::Draw(x, y, color) => {
                if self.ui.get_replay() {
                    return;
                }
                state.field.draw(x, y, color);
                if state
                    .inspected_cell
                    .is_some_and(|(cx, cy, _)| cx == x && cy == y)
                {
                    state.inspected_cell = None;
                    self.ui.set_cell_details(PixelDetails::default());
                    cancel_pixel_inspection();
                }
                return;
            }
            Event::Chat(message) => {
                if !state.messages.iter().any(|old| old.matches(&message)) {
                    if !self.ui.get_chat_open()
                        && mentions(&message.text, self.ui.get_user_name().as_str())
                    {
                        self.ui.set_new_mention(true);
                    }
                    state.messages.push(message);
                    self.update_chat(&mut state);
                }
                return;
            }
            Event::Cooldown(milliseconds) => {
                state.cooldown_duration = f64::from(milliseconds);
                state.cooldown = js_sys::Date::now() + state.cooldown_duration;
                return;
            }
            Event::Online(count) => {
                self.ui.set_status(format!("Онлайн {count}").into());
                self.ui.set_online_count(count.min(i32::MAX as u32) as i32);
                return;
            }
            Event::Pause(paused) => {
                self.ui.set_paused(paused);
                return;
            }
        };
        state.field.begin(geometry);
        let geometry = &state.field.geometry;
        self.ui.set_truecolor(geometry.color_scheme == "truecolor");
        self.ui.set_ready(false);
        drop(state);
        snapshot();
    }

    fn update_chat(&self, state: &mut State) {
        if state.messages.len() > 200 {
            state.messages.drain(..state.messages.len() - 200);
        }
        let mention = crate::rich_text::chat_mentions(self.ui.get_user_name().as_str());
        let mut days = Vec::new();
        let mut day = String::new();
        let mut rows = Vec::new();
        for message in &state.messages {
            let display = serde_json::from_str::<ChatDisplay>(&chat_display(
                message.time as f64,
                &message.text,
            ))
            .unwrap_or_else(|_| ChatDisplay {
                day: String::new(),
                time: String::new(),
                text: message.text.clone(),
            });
            if day != display.day && !rows.is_empty() {
                days.push(ChatDay {
                    label: day.into(),
                    messages: ModelRc::new(VecModel::from(std::mem::take(&mut rows))),
                });
            }
            day = display.day;
            rows.push(MessageRow {
                time: display.time.into(),
                name: message.name.clone().into(),
                label: player_name(&message.name).into(),
                area: message.area.clone().into(),
                text: StyledText::parse_interpolated::<StyledText>(
                    &crate::rich_text::chat_markdown(&display.text, mention.as_ref()),
                    &[],
                )
                .unwrap_or_else(|_| string_to_styled_text(display.text)),
            });
        }
        if !rows.is_empty() {
            days.push(ChatDay {
                label: day.into(),
                messages: ModelRc::new(VecModel::from(rows)),
            });
        }
        self.ui.set_chat_days(ModelRc::new(VecModel::from(days)));
    }
}

fn update_pixel_preview(ui: &App, state: &mut State) {
    let (x, y) = (ui.get_cell_x(), ui.get_cell_y());
    let coords = if ui.get_cell_active() {
        state.field.server_coordinates(x, y)
    } else {
        None
    };
    if let Some([r, g, b]) = coords.and_then(|_| state.field.pick(x, y)) {
        let color = slint::Color::from_rgb_u8(r, g, b);
        if ui.get_cell_color() != color {
            ui.set_cell_color(color);
        }
    }
    let inspected = coords
        .filter(|_| ui.get_cell_inspectable())
        .map(|(x, y)| (x, y, ui.get_finished()));
    if inspected != state.inspected_cell {
        state.inspected_cell = inspected;
        ui.set_cell_details(PixelDetails::default());
        if let Some((x, y, finished)) = inspected {
            inspect_pixel(x, y, finished);
        } else {
            cancel_pixel_inspection();
        }
    }
    let label = coords.map_or_else(String::new, |(x, y)| format!("[{x}, {y}]"));
    if ui.get_cell_coordinates().as_str() != label {
        ui.set_cell_coordinates(label.into());
    }
}

fn slint_rgb(rgb: u32) -> slint::Color {
    let [_, r, g, b] = rgb.to_be_bytes();
    slint::Color::from_rgb_u8(r, g, b)
}

fn format_color(color: slint::Color) -> String {
    format!(
        "#{:02x}{:02x}{:02x}",
        color.red(),
        color.green(),
        color.blue()
    )
}

fn update_editor_preview(ui: &App, rgb: u32) {
    use crate::palette_color;
    let (hue, saturation, value) = palette_color::hsv(rgb);
    ui.set_editor_hue(hue);
    ui.set_editor_saturation(saturation);
    ui.set_editor_value(value);
    ui.set_editor_hue_color(slint_rgb(palette_color::rgb(hue, 1.0, 1.0)));
    ui.set_editor_color(slint_rgb(rgb));
}

fn set_editor_color(ui: &App, rgb: u32) {
    update_editor_preview(ui, rgb);
    ui.set_editor_hex(format!("#{rgb:06x}").into());
}

fn render_tile(field: &Field, index: usize) -> FieldTile {
    let tile = field.tile(index);
    let mut buffer = SharedPixelBuffer::<Rgba8Pixel>::new(tile.width, tile.height);
    field.copy_tile(&tile, buffer.make_mut_bytes());
    FieldTile {
        column: tile.x as f32,
        row: tile.y as f32,
        columns: tile.width as f32,
        rows: tile.height as f32,
        image: Image::from_rgba8(buffer),
    }
}

fn update_visible_tiles(ui: &App, state: &mut State, redraw: Redraw) {
    let field = state
        .life
        .as_ref()
        .map(|life| &life.field)
        .or(state.offline_field.as_ref())
        .unwrap_or(&state.field);
    let zoom = ui.get_zoom();
    let x = ui.get_origin_x();
    let y = ui.get_origin_y();
    let region = field.viewport_tiles(
        -x / zoom,
        -y / zoom,
        (ui.get_viewport_width() - x) / zoom,
        (ui.get_viewport_height() - y) / zoom,
    );
    if matches!(redraw, Redraw::Snapshot) || region != state.tile_region {
        let tiles: Vec<_> = region
            .indices()
            .map(|index| {
                let unchanged = match &redraw {
                    Redraw::None => true,
                    Redraw::Tiles(changed) => !changed.contains(&index),
                    Redraw::Snapshot => false,
                };
                if unchanged {
                    if let Some(tile) = state.tile_region.model_row(index)
                        .and_then(|row| state.tiles.row_data(row))
                    {
                        return tile;
                    }
                }
                render_tile(field, index)
            })
            .collect();
        state.tiles.set_vec(tiles);
        state.tile_region = region;
    } else if let Redraw::Tiles(indices) = redraw {
        for index in indices {
            if let Some(row) = region.model_row(index) {
                state.tiles.set_row_data(row, render_tile(field, index));
            }
        }
    }
}
