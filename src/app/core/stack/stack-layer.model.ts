export interface StackItem {
  /** A product name shown as-is (e.g. 'Angular'), or an i18n key when `translate` is set. */
  label: string;
  translate?: boolean;
}

export interface StackLayer {
  icon: string;
  nameKey: string;
  whyKey: string;
  items: StackItem[];
}
