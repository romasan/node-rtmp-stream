function e(e){return e&&e.__esModule?e.default:e}var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},o={},l={},n=t.parcelRequire8661;null==n&&((n=function(e){if(e in o)return o[e].exports;if(e in l){var t=l[e];delete l[e];var n={id:e,exports:{}};return o[e]=n,t.call(n.exports,n,n.exports),n.exports}var a=new Error("Cannot find module '"+e+"'");throw a.code="MODULE_NOT_FOUND",a}).register=function(e,t){l[e]=t},t.parcelRequire8661=n);var a=n("ayMG0");n("acw62");var r=n("aRPiL"),s=(a=n("ayMG0"),n("acw62")),c=n("fAX6M"),i=n("7rkUU"),d=n("im20c");const f=()=>{const[t,o]=(0,s.useState)({}),[l,n]=(0,s.useState)(""),r=e(c)(),f=(0,s.useRef)(null);(0,s.useEffect)((()=>{if(!l&&t?.palette){const e="black"in t?.palette?"black":(Object.keys(t?.palette)||[]).pop();n(e)}}),[l,t]);return(0,s.useEffect)((()=>{d.default.on("ws:init",(e=>{o(((t={})=>({...t,...e})))}))}),[]),(0,a.jsxs)("div",{className:r?"mobile":"",children:[(0,a.jsx)(i.Canvas,{mode:i.EMode.CLICK,className:"CV0dzq_canvas",color:t?.palette?.[l],onClick:(e,t)=>{console.log("==== click",{x:e,y:t})},onSelect:(e,t)=>{console.log("==== select",e,t)},children:(0,a.jsx)("canvas",{className:"CV0dzq_layer",width:"426px",height:"240px",ref:f})}),t?.palette&&(0,a.jsx)(i.Palette,{color:l,colors:t?.palette,setColor:n}),(0,a.jsx)(i.Tools,{})]})};var u=n("5LNJK"),p=n("ksj8G");(0,u.start)().then((e=>{"qq"===e?((0,p.connect)(),(0,r.createRoot)(document.getElementById("root")).render((0,a.jsx)(f,{}))):document.location.href="/"})).catch((()=>{}));
//# sourceMappingURL=index.1d707a6c.js.map
