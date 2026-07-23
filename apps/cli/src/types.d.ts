declare module 'inquirer' {
  interface Inquirer {
    prompt<T>(questions: any): Promise<T>;
  }
  const inquirer: Inquirer;
  export default inquirer;
}
