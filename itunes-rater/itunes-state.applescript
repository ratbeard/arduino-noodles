set trackName to null
set trackRating to null
set trackLoved to null
set trackPosition to null

tell application "iTunes"
  set playerState to player state
  set playerPosition to player position
  set playerVolume to sound volume

  # Wrap in a try to handle a music stream playing, which we can't get info from :(
  try
    set trackLoved to the loved of the current track
    set trackName to the name of the current track
    set trackRating to the rating of the current track
    set trackDuration to the duration of the current track
  end try
end tell


return {state:playerState, position:playerPosition, volume:playerVolume, name:trackName, rating:trackRating, isLoved:trackLoved, duration:trackDuration}
