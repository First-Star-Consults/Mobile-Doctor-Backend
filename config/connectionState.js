import mongoose from "mongoose";


const connectionState = {
    connected: false,
    connecting: false,
    error: null
}


const connect = async () => {
    connectionState.connecting = true;
    console.log("database connecting...");


    try {

        await mongoose.connect("mongodb://127.0.0.1:27017/mobileDoctorDB")
        .then(() => console.log("Database Connected!"))
        connectionState.connected = true;
        console.log("connected:",connectionState.connected = true);

    }
    catch (error) {
        connectionState.error = error;
        console.log(error);
    } finally {
        connectionState.connected = false
    }
}

const disconnect = async () => {
    await mongoose.disconnect();
    connectionState.connected = false;
    console.log("Database is disconnected");
}


export { connectionState, connect, disconnect };