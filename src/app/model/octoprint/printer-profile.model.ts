export interface OctoprintPrinterProfiles {
  profiles: {
    [key: string]: OctoprintPrinterProfile;
  };
}

export interface OctoprintPrinterProfile {
  id: string;
  current: boolean;
  name: string;
  model: string;
  axes: OctoprintPrinterAxis;
}

interface OctoprintPrinterAxis {
  x: OctoprintAxisDetails;
  y: OctoprintAxisDetails;
  z: OctoprintAxisDetails;
}

interface OctoprintAxisDetails {
  inverted: boolean;
}
