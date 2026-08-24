declare module '*.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.wav' {
  const asset: number;
  export default asset;
}
