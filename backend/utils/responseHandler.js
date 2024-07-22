const success = (res, data) => {
    res.status(200).json(data);
};

const error = (res, error) => {
    res.status(500).json({ error: error.message });
};

module.exports = {
    success,
    error,
};
