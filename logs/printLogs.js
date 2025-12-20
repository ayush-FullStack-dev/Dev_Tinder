import chalk from "chalk";
import figlet from "figlet";

export const info = msg => console.log(chalk.hex("#9e9e9e")(msg));

export const success = msg => console.log(chalk.hex("#4CAF50")(msg));

export const errorLog = msg => console.log(chalk.hex("#b23b3b")(msg));

export const printASCII = msg =>
    console.log(
        chalk.white(
            figlet.textSync(msg, {
                font: "Slant"
            })
        )
    );

export default chalk;
