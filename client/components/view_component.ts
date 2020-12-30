// used to control components. Terminology taken from existing html element
export interface ViewComponent {
    hasFocus(): boolean;
    focus(): void;
    blur(): void;
}