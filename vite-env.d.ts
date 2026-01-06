interface ImportMetaEnv {
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// requestIdleCallback polyfill type
interface IdleDeadline {
    didTimeout: boolean;
    timeRemaining(): number;
}

type IdleCallbackHandle = number;

interface Window {
    requestIdleCallback(
        callback: (deadline: IdleDeadline) => void,
        options?: { timeout: number }
    ): IdleCallbackHandle;
    cancelIdleCallback(handle: IdleCallbackHandle): void;
}

declare function requestIdleCallback(
    callback: (deadline: IdleDeadline) => void,
    options?: { timeout: number }
): IdleCallbackHandle;

declare function cancelIdleCallback(handle: IdleCallbackHandle): void;
