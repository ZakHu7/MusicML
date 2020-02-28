import React, {useState, useEffect} from 'react';
import loadingGif from './loadingCircles.gif';
import './App.css';






function App() {
  
  const mVae = require('@magenta/music/node/music_vae');
  const mRnn = require('@magenta/music/node/music_rnn');
  const mm = require('@magenta/music/node/core');

  // These hacks below are needed because the library uses performance and fetch which
  // exist in browsers but not in node. We are working on simplifying this!
  // const globalAny = global;
  // globalAny.performance = Date;
  // globalAny.fetch = require('node-fetch');

  // Your code:
  const modelVae = new mVae.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_4bar_small_q2');
  const musicRnn = new mRnn.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
  
  modelVae.initialize();
  musicRnn.initialize();

  const TWINKLE_TWINKLE = {
    notes: [
      {pitch: 60, startTime: 0.0, endTime: 0.5},
      {pitch: 60, startTime: 0.5, endTime: 1.0},
      {pitch: 67, startTime: 1.0, endTime: 1.5},
      {pitch: 67, startTime: 1.5, endTime: 2.0},
      {pitch: 69, startTime: 2.0, endTime: 2.5},
      {pitch: 69, startTime: 2.5, endTime: 3.0},
      {pitch: 67, startTime: 3.0, endTime: 4.0},
      {pitch: 65, startTime: 4.0, endTime: 4.5},
      {pitch: 65, startTime: 4.5, endTime: 5.0},
      {pitch: 64, startTime: 5.0, endTime: 5.5},
      {pitch: 64, startTime: 5.5, endTime: 6.0},
      {pitch: 62, startTime: 6.0, endTime: 6.5},
      {pitch: 62, startTime: 6.5, endTime: 7.0},
      {pitch: 60, startTime: 7.0, endTime: 8.0},  
    ],
    totalTime: 8
  };

  const DRUMS = {
    notes: [
      { pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 38, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 42, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 46, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true },
      { pitch: 42, quantizedStartStep: 2, quantizedEndStep: 3, isDrum: true },
      { pitch: 42, quantizedStartStep: 3, quantizedEndStep: 4, isDrum: true },
      { pitch: 42, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 50, quantizedStartStep: 4, quantizedEndStep: 5, isDrum: true },
      { pitch: 36, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 38, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 42, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 45, quantizedStartStep: 6, quantizedEndStep: 7, isDrum: true },
      { pitch: 36, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 42, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 46, quantizedStartStep: 8, quantizedEndStep: 9, isDrum: true },
      { pitch: 42, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
      { pitch: 48, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
      { pitch: 50, quantizedStartStep: 10, quantizedEndStep: 11, isDrum: true },
    ],
    quantizationInfo: {stepsPerQuarter: 4},
    tempos: [{time: 0, qpm: 120}],
    totalQuantizedSteps: 11
  };

  /////////////////////////////////////////////////////////////////////////////////////////
  // var midime;
  // var currentMel;
  // var training = {};

  var player = new mm.Player();
  var viz;
  player.callbackObject = {
    run: (note) => viz.redraw(note),
    stop: () => {console.log('done');}
  };
  player.resumeContext();

  const [loading, setLoading] = useState(false);
  
  const [midime, setMidime] = useState(null);
  const [currentMel, setCurrentMel] = useState(null);
  const [training, setTraining] = useState({});

  // useEffect(() => {
  //   console.log("use effect")
  //   viz = new mm.PianoRollCanvasVisualizer(TWINKLE_TWINKLE, document.getElementById('canvas'));
  //   player.callbackObject = {
  //     run: (note) => viz.redraw(note),
  //     stop: () => {console.log('done');}
  //   };
  // },[]);

  useEffect(() => {
    if (midime != undefined && midime != null) {
      midime.initialize();
    }
  }, [midime])

  useEffect(() => {
    if (currentMel != undefined && currentMel != null) {
      updateVis(currentMel)
    }
  }, [currentMel])


  var rnn_steps = 30;
  var rnn_temperature = 1.2;
  var trainingSteps = 100;


  function updateVis(mel) {
    viz = new mm.PianoRollSVGVisualizer(mel, document.getElementById('vizInput'));
  }

  function stopPlayer() {
    if (player.isPlaying()) {
      player.stop();
    }
  }

  function loopMelody(mel) {
    // updateVis(mel)
    player.start(mel).then(() => {
      if (!player.isPlaying()) {
        setCurrentMel(mel)
        loopMelody(mel);
      } else {
        player.stop();
      }
    });
  }

  async function loopMelodyStep(mel) {
    updateVis(mel)
    await player.start(mel)
    const stepMel = await musicRnn.continueSequence(mel, rnn_steps, rnn_temperature);

    console.log("looped")
    if (!player.isPlaying()) {
      loopMelodyStep(stepMel);
    } else {
      player.stop();
    }
  }

  async function playTwinkle() {
    const qns = mm.sequences.quantizeNoteSequence(TWINKLE_TWINKLE, 4);
    setCurrentMel(qns)
    // loopMelodyStep(qns);
    // const sample = await musicRnn.continueSequence(qns, rnn_steps, rnn_temperature);

    // updateVis(sample)
    // loopMelodyStep(sample);
  }

  async function play() {
    console.log("play")
    console.log(currentMel)
    
    stopPlayer();
    loopMelody(currentMel);

    // MusicRnn
    // const qns = mm.sequences.quantizeNoteSequence(TWINKLE_TWINKLE, 4);
    // musicRnn
    //   .continueSequence(qns, rnn_steps, rnn_temperature)
    //   .then((sample) => player.start(sample));
    
    // MusicVAE
    // const samples = await modelVae.sample(1);
    // console.log("received samples")
      
    // updateVis(samples[0])
    // player.start(samples[0]);
  }



  // Loads an example if you don't have a file.
  async function loadSample() {
    setLoading(true);
    setMidime(new mVae.MidiMe({epochs: 100}));

    
    const url = 'https://cdn.glitch.com/d18fef17-09a1-41f5-a5ff-63a80674b090%2Fmel_input.mid?v=1564186536933';
    //const url = 'https://cdn.glitch.com/d18fef17-09a1-41f5-a5ff-63a80674b090%2Fchpn_op10_e01_format0.mid?1556142864200';
    let mel = await mm.urlToNoteSequence(url);
    const qnsMel = mm.sequences.quantizeNoteSequence(mel, 4);

    console.log(qnsMel)

    // This is the input that we're going to train on.
    const chunks = getChunks([qnsMel]);
    const z = await modelVae.encode(chunks);  // shape of z is [chunks, 256]
    
    training.z = z;


    updateVis(mel);
    setCurrentMel(mel);
    console.log(mel)

    console.log(midime)
    setLoading(false);
    // loopMelody(mel);

    function getChunks(qnsMel) {
      // Encode the input into MusicVAE, get back a z.
      // Split this sequence into 32 bar chunks.
      let chunks = [];
      qnsMel.forEach((m) => {
        const melChunks = mm.sequences.split(mm.sequences.clone(m), 16 * 2);
        chunks = chunks.concat(melChunks);
      });
      return chunks;
    }

  }

  // Train the model!!
  async function train() {
        

    setLoading(true);
    console.log("training")
    stopPlayer();

    console.log(midime)
    
    setCurrentMel(null);
    var totalSteps = midime.config.epochs = trainingSteps;
    
    const losses = [];

    console.log(training.z)

    await midime.train(training.z, async (epoch, logs) => {
      // await mm.tf.nextFrame();
      trainingSteps = epoch + 1;
      losses.push(logs.total);
      // plotLoss(losses);
    });
    console.log("training done")

    let zArray;
  
    // If we've trained, then we sample from MidiMe.
    const s = await midime.sample(1);
    zArray = s.arraySync()[0];
    var mel = (await modelVae.decode(s))[0];

    console.log("got new sequence")
    
    // Get the 4 inputs from midime too.
    const z = midime.encoder.predict(s);
    const z_ = z[0].arraySync()[0];
    s.dispose();

    setCurrentMel(mel);

    setLoading(false);

  }



  return (
    <div className="App">
      <header className="App-header">
        {loading ? <img src={loadingGif} className="App-logo" alt="logo" /> : <div></div>}
        
        <svg id="vizInput"></svg>
        
        <button onClick={playTwinkle}><h1>Set Twinkle Twinkle</h1></button>
        <button onClick={play}><h1>Play</h1></button>
        <button onClick={loadSample}><h1>Load Sample</h1></button>
        <button onClick={train}><h1>Train</h1></button>
        {JSON.stringify(midime)}
        {JSON.stringify("HELOLo")}
        {JSON.stringify(midime == null || midime == undefined)}
      </header>
    </div>
  );
}

export default App;
