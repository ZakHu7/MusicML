import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
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
  var player = new mm.Player();
  
  
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

  const [canvasRef, setCanvasRef] = useState(React.createRef());
  var viz;

  useEffect(() => {
    viz = new mm.Visualizer(TWINKLE_TWINKLE, document.getElementById('canvas'));
    player = new mm.Player(false, {
      run: (note) => viz.redraw(note),
      stop: () => {console.log('done');}
    });
  });

  var rnn_steps = 20;
  var rnn_temperature = 1.5;




  function play() {
    if (player.isPlaying()) {
      player.stop();
      return;
    }
    player.resumeContext(); // enable audio


    // const qns = mm.sequences.quantizeNoteSequence(TWINKLE_TWINKLE, 4);
    // musicRnn
    //   .continueSequence(qns, rnn_steps, rnn_temperature)
    //   .then((sample) => player.start(sample));
    
    modelVae.sample(1)
      .then((samples) => {
        viz = new mm.Visualizer(samples[0], document.getElementById('canvas'));

        player.start(samples[0]);
      });
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <canvas id="canvas" ref={canvasRef}></canvas>
        <button onClick={play}><h1>Play Trio</h1></button>
      </header>
    </div>
  );
}

export default App;
