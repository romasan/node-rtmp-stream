export const eq = (a: any, b: any) => {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch (error) {}

    return false;
};
