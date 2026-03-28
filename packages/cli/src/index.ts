import { Command } from "commander";
import { SERVICE_NAMES } from "@airails/shared";

const VERSION = "0.0.1";

const program = new Command();

program.name("airails").description("AIRails CLI").version(VERSION);

program
  .command("health")
  .description("Check service health")
  .action(() => {
    console.log("Available services:", Object.values(SERVICE_NAMES).join(", "));
  });

program.parse();
