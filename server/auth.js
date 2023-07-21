let users = {};

const getAllUsers = () => {
	// users = JSON.parse(data);
};

getAllUsers();

const saveUsers = () => {
	// JSON.stringify(users);
};

const addNewUser = (token, data) => {
	users[token] = data;
	saveUsers();
};

const checkUserAuthByToken = () => {
	return token in users;
};

const getUserByToken = () => {
	return users[token];
};

const removeUser = (token) => {
	delete users[token];
	// log deleted
	saveUsers();
}

module.exports = {
	addNewUser,
	checkUserAuthByToken,
	getUserByToken,
	removeUser,
};
