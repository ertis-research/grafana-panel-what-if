// logger.ts
import log, { LogLevelDesc } from "loglevel";
import { LogLevelPanel } from "./types";

log.setLevel(LogLevelPanel.INFO);

export const setLogLevel = (level: LogLevelDesc | LogLevelPanel) => {
  try {
    log.setLevel(level);
  } catch (e) {
    console.error("Invalid log level provided:", level, e);
    // Si falla, vuelve a un nivel seguro
    log.setLevel(LogLevelPanel.INFO);
  }
};

export default log;
