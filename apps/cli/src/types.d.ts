declare module 'inquirer' {
  const inquirer: {
    prompt(questions: any): Promise<Record<string, any>>;
  };
  export default inquirer;
}
