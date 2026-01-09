import { th } from "zod/locales";

interface GenMacParams {
  prefixs: {
    pre1: string;
    pre2?: string | undefined;
    pre3?: string | undefined;
  };
}

export const isValidMacPrefix = (prefix: string): boolean => {
  const hexRegex = /^[0-9A-Fa-f]{2}$/;
  return hexRegex.test(prefix);
};

const genMac = ({ prefixs }: GenMacParams): string => {
  const hexDigits = "0123456789ABCDEF";
  let octetsToGenerate = 6;
  let macAddress = "";
  if (prefixs.pre1 && isValidMacPrefix(prefixs.pre1)) {
    macAddress += prefixs.pre1;
    octetsToGenerate--;
    if (prefixs.pre2 && isValidMacPrefix(prefixs.pre2)) {
      macAddress += ":" + prefixs.pre2;
      octetsToGenerate--;
      if (prefixs.pre3 && isValidMacPrefix(prefixs.pre3)) {
        macAddress += ":" + prefixs.pre3;
        octetsToGenerate--;
      }
    }
  }

  for (let i = 0; i < octetsToGenerate; i++) {
    let octet = "";
    for (let j = 0; j < 2; j++) {
      octet += hexDigits.charAt(Math.floor(Math.random() * hexDigits.length));
    }
    macAddress += ":" + octet;
  }
  return macAddress;
};

export default genMac;
