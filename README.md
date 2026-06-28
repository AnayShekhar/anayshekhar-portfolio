# anay's portfolio

this is a portfolio website. its like a little computational notebook thing about what im working on. 

the whole site is inside an old macintosh computer that you can see in 3d. when it loads the screen flickers on like a real crt and types out in a terminal and then the actual website shows up on the screen. 

## how it works

the website is drawn ONTO the screen of the mac as a texture so it bends with the curved glass like a real old monitor. its all painted onto a canvas and then put on the screen mesh with three.js.

clicking and scrolling works by shooting an invisible ray at the screen to figure out where you clicked. 

## what i used

- next.js (with react)
- three.js for the 3d mac and all the rendering
- typescript
- tailwind
- framer motion

## sections

- hero (the hi im anay part)
- about / who am i
- projects / experiments
- future / predictions
- contact / connection

## running it

you need node installed first. then just do:

```
npm install
npm run dev
```

then open `http://localhost:3000` in your browser and it should be there.

to build it for real:

```
npm run build
npm start
```

## notes

the 3d model is in `public/mac.glb`. most of the actual magic happens in `src/components/mac/` 
thats pretty much it. thanks for looking :)

## credits
the 3d model is free from sketch fab: https://skfb.ly/67W6z 
