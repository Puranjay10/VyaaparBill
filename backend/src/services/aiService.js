const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const processInvoice = async (filePath) => {

    const formData = new FormData();

    formData.append(
        "file",
        fs.createReadStream(filePath)
    );

    const response = await axios.post(

        `${process.env.AI_SERVICE_URL}/upload`,

        formData,

        {
            headers: formData.getHeaders(),
        }

    );

    return response.data;

};

module.exports = {
    processInvoice,
};