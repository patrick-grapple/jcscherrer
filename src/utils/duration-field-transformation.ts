export const formatDuration = (duration: any) => {
  if (!duration) {
    return "60 min";
  }
  let hours = duration.split(":")[0];
  let minutes = duration.split(":")[1];

  // change to minutes
  minutes = parseInt(hours) * 60 + parseInt(minutes);
  if (minutes < 45) {
    minutes = 30;
  } else if (minutes < 60) {
    minutes = 45;
  } else if (minutes < 75) {
    minutes = 60;
  } else if (minutes < 105) {
    minutes = 90;
  } else {
    minutes = 120;
  }
  return minutes + " min";
};
