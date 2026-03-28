import chalk from "chalk";
import ora from "ora";

const noColor = !!process.env["NO_COLOR"];

export function success(msg: string): void {
  console.log(noColor ? `✓ ${msg}` : chalk.green(`✓ ${msg}`));
}

export function warn(msg: string): void {
  console.log(noColor ? `⚠ ${msg}` : chalk.yellow(`⚠ ${msg}`));
}

export function error(msg: string): void {
  console.error(noColor ? `✗ ${msg}` : chalk.red(`✗ ${msg}`));
}

export function info(msg: string): void {
  console.log(noColor ? `ℹ ${msg}` : chalk.blue(`ℹ ${msg}`));
}

export function spinner(text: string): ReturnType<typeof ora> {
  return ora({ text, color: noColor ? undefined : "cyan" });
}
