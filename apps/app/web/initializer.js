export default function initializer() {
    return {
        onFailure(error) {
            console.error(error);
            document.querySelector('#canvas').hidden = true;
            document.querySelector('#fallback').hidden = false;
        },
    };
}
