export function createChatFontLoader(fetchFont, installFont) {
    let pending;
    return () => {
        if (!pending) {
            pending = Promise.resolve().then(fetchFont).then(async response => {
                if (!response.ok) throw new Error(`Chat font: HTTP ${response.status}`);
                installFont(new Uint8Array(await response.arrayBuffer()));
            }).catch(error => {
                pending = undefined;
                throw error;
            });
        }
        return pending;
    };
}
