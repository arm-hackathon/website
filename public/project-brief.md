# ICARUS / initial project plan

ICARUS is a simulation-first Physical AI prototype for the Arm Create AI Optimization Challenge, Physical AI track.

The goal is a visible proof loop:

```text
simulated habitat -> telemetry -> local fault inference -> safety governor -> virtual actuator -> changed plant state
```

The first live website layer is **Connections**. It defines rooms, processing areas, notes, tags, biases, and directed actuator paths. The starter topology contains Crew Cabin A, Crew Cabin B, Lab, and Air Processing Bay. Users can add independent preset rooms and create one-way or two-way actuator connections.

Planned interface layers:

- Live system: current plant state, actuator health, model output, and the next bounded action.
- Scenarios: nominal, primary-fan degradation, invalid telemetry, and replayable fault timelines.
- Telemetry: airflow, CO2 proxy, actuator output, tracking residual, and model inputs.
- Benchmarks: measured FP32 and INT8 inference performance on a declared Arm64 target.

The system is simulation-only. It does not control real spacecraft, life-support equipment, HVAC, or production actuators. Abstract values are not real measurements or safety thresholds.

Team contributors: Alex Kurkar, Ben, and MS-Mesh.