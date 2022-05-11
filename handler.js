require("dotenv").config({ path: "./.env" });

const isEmpty = require("lodash").isEmpty;
const validator = require("validator");
const connectToDatabase = require("./db");
const Note = require("./models/Note");

const createErrorResponse = (statusCode, message) => ({
  statusCode: statusCode || 501,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    error: message || "An Error occurred.",
  }),
});

const returnError = (error) => {
  console.log(error);
  if (error.name) {
    const message = `Invalid ${error.path}: ${error.value}`;
    callback(null, createErrorResponse(400, `Error:: ${message}`));
  } else {
    callback(
      null,
      createErrorResponse(error.statusCode || 500, `Error:: ${error.name}`)
    );
  }
};

/**
 * Notes CURD functions parameters
 * @param {*} event data that's passed to the function upon execution
 *          - for get note by ID and delete will get the Note ID from the event
 * @param {*} context sets callbackWaitsForEmptyEventLoop false
 * @param {*} callback sends a response success or failure
 * @returns
 */

module.exports.create = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (isEmpty(event.body)) {
    return callback(null, createErrorResponse(400, "Missing details"));
  }

  await connectToDatabase();

  const noteLength = await Note.countDocuments();

  if (noteLength > 9) {
    return callback(null, createErrorResponse(400, "Notes' limit reached"));
  }

  const { title, description, reminder } = JSON.parse(event.body);

  const noteObj = new Note({
    title,
    description,
    reminder,
  });

  if (noteObj.validateSync()) {
    return callback(null, createErrorResponse(400, "Incorrect note details"));
  }

  try {
    const note = await Note.create(noteObj);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(note),
    });
    console.log("Note has been created.");
  } catch (error) {
    returnError(error);
  }
};

module.exports.getOne = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;
  if (!validator.isAlphanumeric(id)) {
    callback(null, createErrorResponse(400, "Incorrect Id."));
    return;
  }

  try {
    await connectToDatabase();
    const note = await Note.findById(id);

    if (!note) {
      callback(null, createErrorResponse(404, `No Note found with id: ${id}`));
    }

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(note),
    });
  } catch (error) {
    returnError(error);
  }
};

module.exports.getAll = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();
    const notes = await Note.find();
    if (!notes) {
      callback(null, createErrorResponse(404, "No Notes Found."));
    }

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(notes),
    });
  } catch (error) {
    returnError(error);
  }
};

module.exports.update = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const data = JSON.parse(event.body);

  if (!validator.isAlphanumeric(event.pathParameters.id)) {
    callback(null, createErrorResponse(400, "Incorrect Id."));
    return;
  }

  if (isEmpty(data)) {
    return callback(null, createErrorResponse(400, "Missing details"));
  }
  const { title, description, reminder } = data;

  try {
    await connectToDatabase();

    const note = await Note.findById(event.pathParameters.id);

    if (note) {
      note.title = title || note.title;
      note.description = description || note.description;
      note.reminder = reminder || note.reminder;
    }

    const newNote = await note.save();

    callback(null, {
      statusCode: 204,
      body: JSON.stringify(newNote),
    });
  } catch (error) {
    returnError(error);
  }
};

module.exports.delete = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;
  if (!validator.isAlphanumeric(id)) {
    callback(null, createErrorResponse(400, "Incorrect Id."));
    return;
  }
  try {
    await connectToDatabase();
    const note = await Note.findByIdAndRemove(id);

    if (!note) {
      return callback(null, createErrorResponse(404, "Not found."));
    }
  
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: `Removed note with id: ${note._id}`,
        note,
      }),
    });
  } catch (error) {
    returnError(error);
  }
};
