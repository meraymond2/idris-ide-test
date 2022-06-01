import { assert } from "chai";
import { spawn, ChildProcess } from "child_process";

import { FinalReply, IdrisClient } from "idris-ide-client";

describe("Running idris-ide-client", () => {
  it("starts the ide client", async () => {
    let proc = spawn("idris2", ["--ide-mode", "--find-ipkg", "--no-color"]);
    if (!(proc.stdin && proc.stdout)) throw Error("Failed to start process");

    const client = new IdrisClient(proc.stdin, proc.stdout);
    const actual = await client.loadFile("test.idr");
    const expected: FinalReply.LoadFile = {
      id: 1,
      ok: true,
      type: ":return",
    };
    assert.deepEqual(actual, expected);
    proc.kill();
  });
});
