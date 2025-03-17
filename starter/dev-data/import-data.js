const mongoose = require("mongoose");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const Tour = require("./../models/tourModel");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connected successfully"));

const data = fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8");

const importData = async () => {
  try {
    const tours = JSON.parse(data);
    await Tour.create(tours);
    console.log("Data imported successfully!");
  } catch (error) {
    console.error("Error importing data", error);
  }
  process.exit();
};
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log("Data deleted successfully!");
  } catch (error) {
    console.error("Error deleting data", error);
  }
  process.exit();
};
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
console.log(process.argv);
