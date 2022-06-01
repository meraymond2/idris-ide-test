import { assert } from "chai"
import { spawn, ChildProcess } from "child_process"

import { InfoReply, FinalReply, IdrisClient, Reply } from "idris-ide-client"

describe("Running idris-ide-client", () => {
  let proc: ChildProcess

  before(async () => {
    proc = spawn("idris2", ["--ide-mode", "--find-ipkg", "--no-color"])
  })

  it("shows the expected warning for the expected line", async () => {
    const warnings: InfoReply.Warning[] = []
    const collectWarnings = (reply: Reply) => {
      if (reply.type === ":warning") warnings.push(reply)
    }

    if (!(proc.stdin && proc.stdout)) throw Error("Failed to start Idris process")
    const client = new IdrisClient(proc.stdin, proc.stdout, {
      debug: false,
      replyCallback: collectWarnings,
    })

    const loadFileResult = await client.loadFile("test.idr")

    assert.equal(warnings.length, 1)
    const expectedWarning: InfoReply.Warning = {
      id: 1,
      type: ":warning",
      err: {
        filename: "test.idr",
        metadata: [],
        start: { line: 4, column: 17 },
        end: { line: 4, column: 18 },
        warning: `While processing right hand side of main. Can't find an implementation for Num String.\n\ntest:4:17--4:18\n 1 | module Main\n 2 | \n 3 | main : IO ()\n 4 | main = putStrLn 1\n                     ^\n`,
      },
    }
    assert.deepEqual(warnings[0], expectedWarning)

    const expectedResult: FinalReply.LoadFile = {
      id: 1,
      ok: false,
      type: ":return",
      err: `Error(s) building file test.idr: While processing right hand side of main. Can't find an implementation for Num String.\n\ntest:4:17--4:18\n 1 | module Main\n 2 | \n 3 | main : IO ()\n 4 | main = putStrLn 1\n                     ^\n`,
    }
    assert.deepEqual(loadFileResult, expectedResult)
  })

  after(async () => {
    proc.kill()
  })
})
