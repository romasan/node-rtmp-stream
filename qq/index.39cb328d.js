function e(e){return e&&e.__esModule?e.default:e}var n="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},t={},o={},r=n.parcelRequire8661;null==r&&((r=function(e){if(e in t)return t[e].exports;if(e in o){var n=o[e];delete o[e];var r={id:e,exports:{}};return t[e]=r,n.call(r.exports,r,r.exports),r.exports}var a=new Error("Cannot find module '"+e+"'");throw a.code="MODULE_NOT_FOUND",a}).register=function(e,n){o[e]=n},n.parcelRequire8661=r);var a=r("ayMG0");r("acw62");var l=r("aRPiL"),i=(a=r("ayMG0"),r("acw62")),c=r("fAX6M"),s=r("iWcyK"),d=r("7SRiy"),f=r("im20c");var u=r("5LNJK"),p=r("ksj8G");(0,u.start)().then((e=>{"fail"!==e?(0,p.connect)():document.location.reload()})).catch((()=>{})),(0,l.createRoot)(document.getElementById("root")).render((0,a.jsx)((()=>{const[n,t]=(0,i.useState)({}),[o,r]=(0,i.useState)(""),l=e(c)();(0,i.useEffect)((()=>{if(!o&&n?.environment?.palette){const e="black"in n?.environment?.palette?"black":(Object.keys(n?.environment?.palette)||[]).pop();r(e)}}),[o,n]);return(0,i.useEffect)((()=>{f.default.on("ws:environment",(e=>{t(((n={})=>({...n,environment:e})))}))}),[]),(0,a.jsxs)("div",{className:l?"mobile":"",children:[(0,a.jsx)(s.Canvas,{mode:s.EMode.SELECT,className:"CV0dzq_canvas",color:n?.environment?.palette[o],onClick:(e,n)=>{console.log("====",{x:e,y:n,color:o})},children:(0,a.jsx)("div",{className:"CV0dzq_layout",children:"FOO"})}),n?.environment?.palette&&(0,a.jsx)(d.Palette,{color:o,colors:n?.environment?.palette,setColor:r})]})}),{}));
//# sourceMappingURL=index.39cb328d.js.map
