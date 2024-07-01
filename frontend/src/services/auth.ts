/* eslint-disable prettier/prettier */
const TOKEN_KEY = "token";

const getToken = (): string => localStorage.getItem(TOKEN_KEY) ?? "";

const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const setID = (id: string): void => {
  localStorage.setItem("userid", id);
}

const getID = (): string => localStorage.getItem("userid") ?? ""

const clearID = (): void => {
  localStorage.removeItem("userid")
}

export { getToken, setToken, clearToken, setID, getID, clearID };
