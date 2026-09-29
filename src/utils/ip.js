import { networkInterfaces } from 'os';

export const getLocalIP = () => {
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // IPv4, not internal (not 127.0.0.1)
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
};

export const getServerIPs = () => {
  const ips = ['http://localhost', 'http://127.0.0.1'];
  const localIP = getLocalIP();

  if (localIP) {
    ips.unshift(`http://${localIP}`);
  }

  return ips;
};
