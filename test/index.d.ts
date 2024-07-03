export { }

declare global {
  namespace NodeJS {
    interface Global {
      window: any;
    }
  }
}
