import { createContext, useState } from "react";
import axios from "axios";
import httpStatus from "http-status";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: "http://localhost:8080/api/v1/users"
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password
      });

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        setUserData(request.data.user);

        client.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${request.data.token}`;

        navigate("/home");
        return request.data;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      let request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token")
        }
      });
      return request.data
    } catch (err) {
        throw err;
    }
  }

  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode
      });
      return request
    } catch (e) {
      throw e;
    }
  }

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin, 
    getHistoryOfUser,
    addToUserHistory
  };

  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};
