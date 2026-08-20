/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ---------------------------------
 * Gamepad – Load, Configure and Use
 * ---------------------------------
 * 
 * This file contains the DualSenseController class, which provides an interface 
 * for working with a DualSense PS5 controller in a p5.js sketch.
 * 
 * The class listens for gamepad connection and disconnection events, updates the 
 * state of the controller each frame, and provides methods to check button states 
 * and trigger vibrations.
 * It also includes a display method to show the current state of the 
 * controller on the canvas.
 * 
 * Note: This example is designed to work with a DualSense PS5 controller, but it 
 * may be compatible with other controllers that follow the standard Gamepad API.
 */


class DualSenseController {
  constructor() {
    this.gamepadIndex = null;
    this.connected = false;
    this.currentGamepad = null;
    this.buttonMap = [
      { name: 'CROSS', index: 0 },
      { name: 'CIRCLE', index: 1 },
      { name: 'SQUARE', index: 2 },
      { name: 'TRIANGLE', index: 3 },
      { name: 'L1', index: 4 },
      { name: 'R1', index: 5 },
      { name: 'L2', index: 6 },
      { name: 'R2', index: 7 },
      { name: 'CREATE', index: 8 },
      { name: 'OPTIONS', index: 9 },
      { name: 'L3', index: 10 },
      { name: 'R3', index: 11 },
      { name: 'UP', index: 12 },
      { name: 'DOWN', index: 13 },
      { name: 'LEFT', index: 14 },
      { name: 'RIGHT', index: 15 }
    ];
    this.buttonStates = this.buttonMap.map((button) => ({
      name: button.name,
      index: button.index,
      pressed: false,
      previousPressed: false,
      value: 0
    }));
    this.displayItems = [
      { type: 'button', name: 'UP', label: 'UP (select)' },
      { type: 'button', name: 'DOWN', label: 'DOWN (select)' },
      { type: 'button', name: 'LEFT', label: 'LEFT (letter)' },
      { type: 'button', name: 'RIGHT', label: 'RIGHT (letter)' },
      { type: 'spacer' },
      { type: 'button', name: 'TRIANGLE', label: 'TRIANGLE (style)' },
      { type: 'button', name: 'CROSS', label: 'CROSS (font)' },
      { type: 'button', name: 'SQUARE', label: 'SQUARE (case)' },
      { type: 'button', name: 'CIRCLE', label: 'CIRCLE (color)' },
      { type: 'spacer' },
      { type: 'button', name: 'L1' },
      { type: 'button', name: 'L2' },
      { type: 'button', name: 'L3' },
      { type: 'spacer' },
      { type: 'button', name: 'R1' },
      { type: 'button', name: 'R2' },
      { type: 'button', name: 'R3' },
      { type: 'spacer' },
      { type: 'axis', name: 'L' },
      { type: 'axis', name: 'R' },
      { type: 'spacer' },
      { type: 'button', name: 'CREATE' },
      { type: 'button', name: 'OPTIONS' },
      { type: 'spacer' },
      { type: 'combo', buttons: ['L1', 'R1'], label: 'L1+R1 (new letter)' },
      { type: 'combo', buttons: ['L2', 'R2'], label: 'L2+R2 (animate)' }
    ];
    this.stickDeadzone = 0.15;
    this.axes = {
      leftX: 0,
      leftY: 0,
      rightX: 0,
      rightY: 0
    };
    this.skipFirstPress = false;

    window.addEventListener('gamepadconnected', (event) => {
      this.gamepadIndex = event.gamepad.index;
      this.connected = true;
      this.skipFirstPress = true;
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      if (event.gamepad.index === this.gamepadIndex) {
        this.gamepadIndex = null;
        this.connected = false;
        this.resetState();
      }
    });
  }

  // Resets the state of the controller, clearing button states and axes values.
  resetState() {
    for (const button of this.buttonStates) {
      button.pressed = false;
      button.previousPressed = false;
      button.value = 0;
    }

    this.axes.leftX = 0;
    this.axes.leftY = 0;
    this.axes.rightX = 0;
    this.axes.rightY = 0;
    this.currentGamepad = null;
  }

  // Updates the state of the controller by reading the current gamepad data.
  update() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];

    if (this.gamepadIndex === null) {
      for (const pad of pads) {
        if (pad) {
          this.gamepadIndex = pad.index;
          break;
        }
      }
    }

    const gamepad = this.gamepadIndex !== null ? pads[this.gamepadIndex] : null;

    if (!gamepad) {
      this.connected = false;
      this.resetState();
      return;
    }

    this.connected = true;
    this.currentGamepad = gamepad;

    for (const target of this.buttonStates) {
      const source = gamepad.buttons[target.index];

      target.previousPressed = target.pressed;
      target.pressed = source ? source.pressed : false;
      target.value = source ? source.value : 0;
    }

    this.axes.leftX = gamepad.axes[0] || 0;
    this.axes.leftY = gamepad.axes[1] || 0;
    this.axes.rightX = gamepad.axes[2] || 0;
    this.axes.rightY = gamepad.axes[3] || 0;

    if (this.skipFirstPress) {
      for (const button of this.buttonStates) {
        button.previousPressed = button.pressed;
      }
      this.skipFirstPress = false;
    }
  }

  // Checks if a specific button is currently pressed by 
  // looking up its state in the buttonStates array.
  isPressed(buttonName) {
    const button = this.buttonStates.find((entry) => entry.name === buttonName);
    return button ? button.pressed : false;
  }

  // Checks if a button was just pressed in the current update cycle by comparing 
  // the current pressed state with the previous pressed state.
  wasPressed(buttonName) {
    const button = this.buttonStates.find((entry) => entry.name === buttonName);
    return button ? button.pressed && !button.previousPressed : false;
  }

  // Checks if all buttons in the given array of button names are currently pressed, 
  // and at least one of them was just pressed in the current update cycle.
  wasComboPressed(buttonNames) {
    return buttonNames.every((buttonName) => this.isPressed(buttonName))
      && buttonNames.some((buttonName) => this.wasPressed(buttonName));
  }

  // Triggers a vibration effect on the controller if supported, using either the 
  // vibrationActuator or hapticActuators API depending on the controller.
  vibrate(duration = 1000) {
    if (!this.currentGamepad) {
      return false;
    }

    const actuator = this.currentGamepad.vibrationActuator;
    if (actuator && typeof actuator.playEffect === 'function') {
      actuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration,
        weakMagnitude: 1,
        strongMagnitude: 1
      });
      return true;
    }

    const hapticActuator = this.currentGamepad.hapticActuators
      && this.currentGamepad.hapticActuators[0];

    if (hapticActuator && typeof hapticActuator.pulse === 'function') {
      hapticActuator.pulse(1, duration);
      return true;
    }

    return false;
  }

  // Displays the current state of the controller on the canvas, 
  // showing which buttons are pressed and the values of the axes.
  display() {
    let lineHeight = 20;
    let x = 32;
    let y = 32;
    push();
    textFont('monospace');
    textSize(16);
    textAlign(LEFT, TOP);

    fill(this.connected ? color(0, 255, 0) : color(255, 0, 0));
    text(this.connected ? 'Controller connected' : 'Press any button to connect controller.', x, y);

    if (this.connected) {
      let currentY = y + lineHeight * 1.5;
      for (const item of this.displayItems) {
        if (item.type === 'spacer') {
          currentY += lineHeight * 0.45;
          continue;
        }

        const active = this.isDisplayItemActive(item);
        fill(active ? 255 : 96);
        text(this.getDisplayItemLabel(item), x, currentY);
        currentY += lineHeight;

      }
    }
    pop();
  }

  // Determines if a stick is active by checking if its axis values 
  // exceed the defined deadzone threshold.
  isStickActive(stickName) {
    if (stickName === 'L') {
      return abs(this.axes.leftX) > this.stickDeadzone || abs(this.axes.leftY) > this.stickDeadzone;
    }

    if (stickName === 'R') {
      return abs(this.axes.rightX) > this.stickDeadzone || abs(this.axes.rightY) > this.stickDeadzone;
    }

    return false;
  }

  // Retrieves the display label for a given stick, showing its name 
  // and current axis values formatted for display.
  getStickLabel(stickName) {
    if (stickName === 'L') {
      return `${stickName} ${this.formatAxisValue(this.axes.leftX)} ${this.formatAxisValue(this.axes.leftY)} (move)`;
    }

    if (stickName === 'R') {
      return `${stickName} ${this.formatAxisValue(this.axes.rightX)} ${this.formatAxisValue(this.axes.rightY)} (rotate/scale)`;
    }

    return stickName;
  }

  // Retrieves the display label for a given item, using custom labels for axes 
  // and falling back to the item's name if no label is provided.
  getDisplayItemLabel(item) {
    if (item.type === 'axis') {
      return this.getStickLabel(item.name);
    }

    return item.label || item.name;
  }

  // Determines if a display item is active based on its type. For buttons, it checks 
  // if the button is pressed. For combos, it checks if all buttons in the combo are pressed. 
  // For axes, it checks if the stick is active.
  isDisplayItemActive(item) {
    if (item.type === 'axis') {
      return this.isStickActive(item.name);
    }

    if (item.type === 'combo') {
      return item.buttons.every((buttonName) => this.isPressed(buttonName));
    }

    return this.isPressed(item.name);
  }

  // Utility function to format axis values for display, showing a '+' sign 
  // for positive values and rounding to one decimal place.
  formatAxisValue(value) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;
  }
}