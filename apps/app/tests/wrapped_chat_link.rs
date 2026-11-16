use std::{cell::RefCell, rc::Rc};
use slint::{ComponentHandle, LogicalPosition, PhysicalSize, platform::{Platform, PlatformError, PointerEventButton, WindowAdapter, WindowEvent, software_renderer::{MinimalSoftwareWindow, RepaintBufferType}}};

slint::slint! {
    import "../../../assets/fonts/CustomFont.ttf";
    export component LinkTest inherits Window {
        width: 200px;
        height: 100px;
        callback clicked(string);
        StyledText {
            width: 180px;
            height: 80px;
            default-font-family: "Custom Font ttf 12h 1.0";
            default-font-size: 16px;
            text: @markdown("<https://www.youtube.com/watch?v=oQT-SYyppYI>");
            link-clicked(url) => { root.clicked(url); }
        }
    }
}

struct TestPlatform(Rc<MinimalSoftwareWindow>);
impl Platform for TestPlatform {
    fn create_window_adapter(&self) -> Result<Rc<dyn WindowAdapter>, PlatformError> {
        Ok(self.0.clone())
    }
}

#[test]
fn clicks_work_on_every_line_of_a_wrapped_link() {
    let window = MinimalSoftwareWindow::new(RepaintBufferType::ReusedBuffer);
    slint::platform::set_platform(Box::new(TestPlatform(window.clone()))).unwrap();
    window.set_size(PhysicalSize::new(200, 100));
    let ui = LinkTest::new().unwrap();
    let clicked = Rc::new(RefCell::new(Vec::new()));
    let events = clicked.clone();
    ui.on_clicked(move |url| events.borrow_mut().push(url.to_string()));
    ui.show().unwrap();
    window.draw_if_needed(|renderer| {
        let mut pixels = vec![slint::platform::software_renderer::Rgb565Pixel::default(); 200 * 100];
        renderer.render(&mut pixels, 200);
    });
    for y in [16., 40.] {
        for x in (2..178).step_by(4) {
            let position = LogicalPosition::new(x as f32, y);
            window.window().dispatch_event(WindowEvent::PointerPressed { position, button: PointerEventButton::Left });
            window.window().dispatch_event(WindowEvent::PointerReleased { position, button: PointerEventButton::Left });
        }
        assert!(clicked.borrow().iter().any(|url| url == "https://www.youtube.com/watch?v=oQT-SYyppYI"), "link must be clickable on line at y={y}");
        clicked.borrow_mut().clear();
    }
}
