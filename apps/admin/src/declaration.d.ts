declare module '*.module.scss';
declare module '*.svg' {
    import * as React from 'react';
    const component: React.FC<React.SVGProps<SVGSVGElement>>;
    export default component;
}
declare module '*.webp' { const url: string; export default url; }
declare module 'event-emitter';
