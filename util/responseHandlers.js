const STATUS_CODES = require("./statusCode");


function sendSuccess(res, { message, data = {}, status = STATUS_CODES.OK, icon = 'success' }) {
    res.status(status).json({
        success: true,
        icon,
        message,
        ...data
    });
}

function sendError(res, { message, status = STATUS_CODES.INTERNAL_ERROR, icon = 'error' }) {
    res.status(status).json({
        success: false,
        icon,
        message
    });
}

module.exports = { sendSuccess, sendError };
