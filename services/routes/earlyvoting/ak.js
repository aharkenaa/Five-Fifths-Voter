
/**
 * Return a promise that will deliver local early voting sites. The data will be amended to whatever is passed in the amend var.
 * @param {*} stateid - must be GA
 * @param {*} locid - must be a valid county in GA
 * @param {*} amend - attach the data to this object
 * see exports.locations below for how to call this directly form the API
 */
locationData = exports.locationData = (stateid, locid, amend) => {
  try {
    locid = locid.toUpperCase();
  }
}