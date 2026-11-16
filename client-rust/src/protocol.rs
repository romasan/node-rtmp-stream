use crate::canvas::Geometry;
use prost::{Message, Oneof};
use serde::Deserialize;

#[derive(Clone, PartialEq, Message)]
struct Frame {
    #[prost(oneof = "Body", tags = "1, 2, 3, 4, 5, 6, 7")]
    body: Option<Body>,
}

#[derive(Clone, PartialEq, Oneof)]
enum Body {
    #[prost(message, tag = "1")]
    Draw(Pixel),
    #[prost(message, tag = "2")]
    Cooldown(Number),
    #[prost(message, tag = "3")]
    Online(Number),
    #[prost(message, tag = "4")]
    Init(Init),
    #[prost(message, tag = "5")]
    Chat(Chat),
    #[prost(message, tag = "6")]
    Pause(Pause),
    #[prost(message, tag = "7")]
    Expand(Extent),
}

#[derive(Clone, PartialEq, Message)]
struct Pixel {
    #[prost(sint32, tag = "1")]
    x: i32,
    #[prost(sint32, tag = "2")]
    y: i32,
    #[prost(uint32, tag = "3")]
    rgb: u32,
}

#[derive(Clone, PartialEq, Message)]
struct Number {
    #[prost(uint32, tag = "1")]
    value: u32,
}

#[derive(Clone, PartialEq, Message)]
struct Extent {
    #[prost(uint32, tag = "1")]
    width: u32,
    #[prost(uint32, tag = "2")]
    height: u32,
    #[prost(sint32, tag = "3")]
    shift_x: i32,
    #[prost(sint32, tag = "4")]
    shift_y: i32,
    #[prost(string, tag = "5")]
    color_scheme: String,
}

impl From<Extent> for Geometry {
    fn from(extent: Extent) -> Self {
        Self {
            width: extent.width,
            height: extent.height,
            shift_x: extent.shift_x,
            shift_y: extent.shift_y,
            color_scheme: extent.color_scheme,
        }
    }
}

#[derive(Clone, PartialEq, Message)]
struct Init {
    #[prost(string, tag = "2")]
    name: String,
    #[prost(uint32, tag = "5")]
    countdown: u32,
    #[prost(bool, tag = "6")]
    is_authorized: bool,
    #[prost(message, optional, tag = "7")]
    canvas: Option<Extent>,
    #[prost(bool, tag = "8")]
    has_finish: bool,
    #[prost(sint64, tag = "9")]
    finish_ms: i64,
    #[prost(string, tag = "10")]
    finish_text: String,
    #[prost(bool, tag = "11")]
    need_authorize: bool,
    #[prost(bool, tag = "12")]
    paused: bool,
}

#[derive(Clone, PartialEq, Message, Deserialize)]
pub struct Chat {
    #[prost(string, tag = "1")]
    #[serde(default)]
    pub id: String,
    #[prost(uint64, tag = "2")]
    pub time: u64,
    #[prost(string, tag = "3")]
    pub text: String,
    #[prost(string, tag = "4")]
    pub name: String,
    #[prost(string, tag = "5")]
    pub area: String,
}

impl Chat {
    pub fn matches(&self, other: &Self) -> bool {
        if !self.id.is_empty() && !other.id.is_empty() {
            self.id == other.id
        } else {
            self.time == other.time
                && self.name == other.name
                && self.text == other.text
                && self.area == other.area
        }
    }
}

#[derive(Clone, PartialEq, Message)]
struct Pause {
    #[prost(bool, tag = "1")]
    paused: bool,
}

#[derive(Debug, PartialEq)]
pub enum Event {
    Draw(i32, i32, [u8; 3]),
    Init(Session),
    Expand(Geometry),
    Chat(Chat),
    Cooldown(u32),
    Online(u32),
    Pause(bool),
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    #[serde(default)]
    pub name: String,
    pub countdown: u32,
    pub is_authorized: bool,
    pub canvas: Geometry,
    pub finish: Option<i64>,
    pub finish_text: String,
    pub need_authorize: bool,
    pub paused: bool,
}

pub fn binary(bytes: &[u8]) -> Option<Event> {
    let frame = Frame::decode(bytes).ok()?;
    Some(match frame.body? {
        Body::Draw(pixel) => {
            let [_, r, g, b] = pixel.rgb.to_be_bytes();
            Event::Draw(pixel.x, pixel.y, [r, g, b])
        }
        Body::Init(init) => Event::Init(Session {
            name: init.name,
            countdown: init.countdown,
            is_authorized: init.is_authorized,
            canvas: init.canvas?.into(),
            finish: init.has_finish.then_some(init.finish_ms),
            finish_text: init.finish_text,
            need_authorize: init.need_authorize,
            paused: init.paused,
        }),
        Body::Expand(extent) => Event::Expand(extent.into()),
        Body::Chat(message) => Event::Chat(message),
        Body::Cooldown(number) => Event::Cooldown(number.value),
        Body::Online(number) => Event::Online(number.value),
        Body::Pause(pause) => Event::Pause(pause.paused),
    })
}

pub fn text(text: &str) -> Option<Event> {
    use serde_json::{Value, from_value};
    #[derive(Deserialize)]
    struct Frame {
        event: String,
        payload: Value,
    }
    let mut frame: Frame = serde_json::from_str(text).ok()?;
    Some(match frame.event.as_str() {
        "drawPix" => {
            let x = i32::try_from(frame.payload["x"].as_i64()?).ok()?;
            let y = i32::try_from(frame.payload["y"].as_i64()?).ok()?;
            let color = frame.payload["color"].as_str()?.strip_prefix('#')?;
            if color.len() != 6 {
                return None;
            }
            let [_, r, g, b] = u32::from_str_radix(color, 16).ok()?.to_be_bytes();
            Event::Draw(x, y, [r, g, b])
        }
        "init" => {
            if frame.payload["finish"] == "newer" {
                frame.payload["finish"] = Value::Null;
            }
            Event::Init(from_value(frame.payload).ok()?)
        }
        "expand" => Event::Expand(from_value(frame.payload).ok()?),
        "chatMessage" => Event::Chat(from_value(frame.payload).ok()?),
        "countdown" => Event::Cooldown(from_value(frame.payload).ok()?),
        "online" => Event::Online(from_value(frame.payload).ok()?),
        "pause" => Event::Pause(from_value(frame.payload).ok()?),
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_frames_encoded_by_shared_protobuf_schema() {
        assert_eq!(
            binary(&[10, 8, 8, 3, 16, 50, 24, 214, 222, 74]),
            Some(Event::Draw(-2, 25, [0x12, 0xaf, 0x56]))
        );
        let bytes = [
            34, 34, 18, 4, 116, 101, 115, 116, 40, 40, 48, 1, 58, 17, 8, 12, 16, 8, 24, 1, 42, 9,
            116, 114, 117, 101, 99, 111, 108, 111, 114, 64, 1, 72, 207, 15,
        ];
        let Some(Event::Init(session)) = binary(&bytes) else {
            panic!("expected init")
        };
        assert_eq!(session.finish, Some(-1000));
        assert_eq!(session.canvas.shift_x, -1);
        assert_eq!(session.canvas.color_scheme, "truecolor");
        assert!(session.is_authorized);
    }

    #[test]
    fn handles_legacy_text_and_heartbeat() {
        assert_eq!(text("3"), None);
        assert_eq!(
            text(r#"{"event":"online","payload":5}"#),
            Some(Event::Online(5))
        );
        assert_eq!(
            text(r##"{"event":"drawPix","payload":{"x":-2,"y":25,"color":"#12af56"}}"##),
            Some(Event::Draw(-2, 25, [0x12, 0xaf, 0x56]))
        );
    }

    #[test]
    fn guest_init_without_name_matches_server_protobuf() {
        // server/utils/wsProtocol.ts encodes this guest init with an empty name.
        let bytes = [
            34, 36, 58, 23, 8, 144, 3, 16, 144, 3, 24, 246, 1, 32, 179, 2, 42, 9, 67, 79, 76,
            79, 82, 83, 95, 51, 50, 82, 7, 84, 73, 77, 69, 79, 85, 84, 88, 1,
        ];
        let guest = r#"{"event":"init","payload":{
            "countdown":0,"isAuthorized":false,
            "canvas":{"width":400,"height":400,"shiftX":123,"shiftY":-154,"colorScheme":"COLORS_32"},
            "finish":"newer","finishText":"TIMEOUT","needAuthorize":true,"paused":false
        }}"#;
        let expected = binary(&bytes).expect("server guest init");
        assert_eq!(text(guest), Some(expected));
    }
}
