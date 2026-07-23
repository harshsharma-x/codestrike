declare module 'inquirer' {
  interface PromptModule {
    prompt<T>(questions: any): Promise<T>;
    register(name: string, prompt: any): void;
  }
  const prompt: PromptModule['prompt'];
  export default prompt;
}
