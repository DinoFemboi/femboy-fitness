# Femboy Fitness
Using DeviceMotionEvent interface to count squats. Includes super cute femboy colours.

## How to play
This game must be played on a phone or other device with motion sensors. Hold your phone in front of you, parallel to the ground (the screen should be facing up, like you're about to take a photo of the ground with your back camera). When you move, the screen will turn blue for a bit. <b>Wait for the screen to turn pink again before making your next movement, otherwise it will not register.</b> When you squat, the femboy on screen will follow you. If the femboy does not move, <b>you must make the downward or upward motion faster or more noticeable.</b> Due to limitations with making webgames, the game can only detect rapid downward/upwards movements, and cannot determine your actual position. The game works best when you squat as follows: quickly down, wait for screen to turn pink, quickly up, wait for screen to turn pink, repeat. Hope you enjoy :3.

## About
I made this game to demonstrate the use of the DeviceMotionEvent interface in webgames. It was very difficult to infer position from this event, since it only provides low-resolution accelerometer data. However, with enough calculus, it was possible to detect rapid movements in a particular direction. Still, this was only tested on iOS Safari, and I suspect cross-browser compatibility will be poor. The project is open-source on GitHub, so I welcome any contributions to improve motion detection or add new features. I'm sure there are enough femboy programmers to help out.

\- Lots of love, DinoFemboi.
