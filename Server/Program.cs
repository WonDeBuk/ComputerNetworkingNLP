using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32;
using SocketIOClient;
using SocketIOClient.Transport;
using System.Text.Json;
using System.Runtime.InteropServices.Marshalling;
using System.Runtime.Versioning;

namespace Server
{
    class Program
    {
        static SocketIOClient.SocketIO? Client = null;
        static readonly object SendLock = new();
        static CancellationTokenSource? ProcessMonitorCTS = null;
        static CancellationTokenSource? ApplicationMonitorCTS = null;

        static async Task Main()
        {
            Console.WriteLine("Server > Server Starting...");
            while (true)
            {
                Console.Write("Server > Input Gateway IP: ");
                string? GatewayIP = Console.ReadLine();
                Console.Write("Server > Input Gateway Port: ");
                string? GatewayPort = Console.ReadLine();

                string GatewayURL = $"http://{GatewayIP}:{GatewayPort}";

                try
                {
                    Client = new SocketIOClient.SocketIO(GatewayURL, new SocketIOOptions
                    {
                        Reconnection = false,
                        Transport = TransportProtocol.WebSocket
                    });
                    Console.WriteLine("Server > SocketIO created.");
                }
                catch (Exception Ex)
                {
                    Console.WriteLine("Server > " + Ex.ToString());
                    return;
                }

                Client.OnConnected += async (Sender, E) =>
                {
                    Console.WriteLine("Server > Connected to Gateway");
                    await Client.EmitAsync("Server:Register", new { IP = "127.0.0.1", Port = "8080" }); // IP/Port might be irrelevant now but keeping for protocol
                };

                Client.OnDisconnected += (Sender, E) =>
                {
                    Console.WriteLine("Server > Disconnected from Gateway");
                };

                Client.On("Server:Connect:Success", Response =>
                {
                    var Data = Response.GetValue<dynamic>();
                    Console.WriteLine("Server > Client connected via Gateway" + Data.ClientID);
                });

                Client.On("Server:Connect:Error:ClientDisconnected", Response =>
                {
                    Console.WriteLine("Server > Client disconnected via Gateway");
                });

                Client.On("Server:Connect", Response =>
                {
                    Console.WriteLine("Server > Client connected via Gateway");
                });

                Client.On("Server:Disconnect", Response =>
                {
                    Console.WriteLine("Server > Client disconnected via Gateway");
                    StopProcessMonitor();
                    StopApplicationMonitor();
                });

                Client.On("Process:Kill", Response =>
                {
                    int PID = Response.GetValue<int>();
                    KillProcess(PID);
                });

                Client.On("Process:Subscribe", Response =>
                {
                    Console.WriteLine("Server > Client subscribed to process updates.");
                    StartProcessMonitor(SendData);
                });

                Client.On("Process:Unsubscribe", Response =>
                {
                    Console.WriteLine("Server > Client unsubscribed from process updates.");
                    StopProcessMonitor();
                });

                Client.On("Application:Subscribe", Response =>
                {
                    Console.WriteLine("Server > Client subscribed to app updates.");
                    StartApplicationMonitor(SendData);
                });

                Client.On("Application:Unsubscribe", Response =>
                {
                    Console.WriteLine("Server > Client unsubscribed from app updates.");
                    StopApplicationMonitor();
                });

                Client.On("Screenshot:Take", Response =>
                {
                    Console.WriteLine("Client requested screenshot.");
                    Capture(SendData);
                });

                Client.On("Webcam:Record", Response =>
                {
                    int Duration = Response.GetValue<int>();
                    Console.WriteLine($"Server > Client requested webcam recording: {Duration}s");
                    Record(Duration, SendData);
                });

                Client.On("Controller:ShutDown", Response =>
                {
                    Console.WriteLine("Server > Client requested SHUTDOWN.");
                    ControllerShutDown();
                });

                Client.On("Controller:Reboot", Response =>
                {
                    Console.WriteLine("Server > Client requested REBOOT.");
                    ControllerReboot();
                });

                Client.On("Controller:Hibernate", Response =>
                {
                    Console.WriteLine("Server > Client requested HIBERNATE.");
                    ControllerHibernate();
                });

                Client.On("Controller:Sleep", Response =>
                {
                    Console.WriteLine("Server > Client requested SLEEP.");
                    ControllerSleep();
                });

                Client.On("Controller:Lock", Response =>
                {
                    Console.WriteLine("Server > Client requested LOCK.");
                    ControllerLock();
                });

                try
                {
                    await Client.ConnectAsync();
                    Console.WriteLine("Server > Connected (ConnectAsync returned)");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Server > Connect Error > " + ex);
                }

                await Task.Delay(-1);
            }

        }

        static void SendData(string EventName, object Data)
        {
            lock (SendLock)
            {
                try
                {
                    if (Client != null && Client.Connected)
                    {
                        Client.EmitAsync(EventName, Data);
                    }
                }
                catch (Exception Ex)
                {
                    Console.WriteLine($"Server > Send error: {Ex.Message}");
                }
            }
        }

        static void KillProcess(int PID)
        {
            try
            {
                var _Process = Process.GetProcessById(PID);
                _Process.Kill();
                Console.WriteLine($"Server > Killed process {_Process.ProcessName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Server > Failed to kill process {PID}: {ex.Message}");
            }
        }

        static void Record(int Duration, Action<string, object> Callback)
        {
            Task.Run(() =>
            {
                try
                {
                    string LocalDatetime = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString();

                    string FileName = $"{LocalDatetime}.mp4";
                    string FilePath = Path.Combine(AppContext.BaseDirectory, FileName);

                    // Bắt đầu ghi video
                    using (var CaptureDevice = new OpenCvSharp.VideoCapture(0))
                    {
                        if (!CaptureDevice.IsOpened())
                        {
                            Console.WriteLine("Server > Failed to open webcam.");
                            return;
                        }

                        int Width = CaptureDevice.FrameWidth;
                        int Height = CaptureDevice.FrameHeight;
                        double FPS = 30;

                        using (var VideoWriter = new OpenCvSharp.VideoWriter(FilePath, OpenCvSharp.FourCC.FromString("avc1"), FPS, new OpenCvSharp.Size(Width, Height)))
                        {
                            if (!VideoWriter.IsOpened())
                            {
                                Console.WriteLine("Server > Failed to open video writer.");
                                return;
                            }

                            DateTime Start = DateTime.Now;
                            using (OpenCvSharp.Mat Frame = new OpenCvSharp.Mat())
                            {
                                while ((DateTime.Now - Start).TotalSeconds < Duration)
                                {
                                    CaptureDevice.Read(Frame);
                                    if (Frame.Empty()) break;
                                    VideoWriter.Write(Frame);
                                }
                            }
                        }
                    }

                    // Gửi Webcam Video hoàn chỉnh
                    if (File.Exists(FilePath))
                    {
                        byte[] Bytes = File.ReadAllBytes(FilePath);
                        string Base64 = Convert.ToBase64String(Bytes);
                        Callback("Webcam:Final", new
                        {
                            TimeStamp = long.Parse(LocalDatetime),
                            Size = Bytes.Length,
                            URL = Base64
                        });
                        Console.WriteLine($"Server > Sent webcam file: {FileName}");
                        File.Delete(FilePath);
                    }
                }
                catch (Exception Ex)
                {
                    Console.WriteLine($"Server > Webcam error: {Ex.Message}");
                }
            });
        }

        static void Capture(Action<string, object> Callback)
        {
            Task.Run(() =>
            {
                try
                {
                    string LocalDatetime = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString();

                    Rectangle Bounds = Rectangle.Empty;
                    foreach (var Screen in System.Windows.Forms.Screen.AllScreens)
                    {
                        Bounds = Rectangle.Union(Bounds, Screen.Bounds);
                    }

                    using (Bitmap Bitmap = new Bitmap(Bounds.Width, Bounds.Height))
                    {
                        using (Graphics Graphics = Graphics.FromImage(Bitmap))
                        {
                            Graphics.CopyFromScreen(Point.Empty, Point.Empty, Bounds.Size);
                        }
                        using (MemoryStream MemoryStream = new MemoryStream())
                        {
                            Bitmap.Save(MemoryStream, ImageFormat.Jpeg);
                            string Base64 = Convert.ToBase64String(MemoryStream.ToArray());
                            Callback("Screenshot:Final", new
                            {
                                TimeStamp = long.Parse(LocalDatetime),
                                Size = MemoryStream.Length,
                                URL = Base64
                            });
                            Console.WriteLine($"Server > Sent screenshot");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Server > Screenshot error: {ex.Message}");
                }
            });
        }

        static void StartProcessMonitor(Action<string, object> Callback)
        {
            if (ProcessMonitorCTS != null)
            {
                return;
            }

            ProcessMonitorCTS = new CancellationTokenSource();
            var Token = ProcessMonitorCTS.Token;

            Task.Run(async () =>
            {
                try
                {
                    while (!Token.IsCancellationRequested)
                    {
                        var ProcessList = new List<object>();

                        foreach (var _Process in Process.GetProcesses())
                        {
                            try
                            {
                                if (_Process.Id == 0) continue;
                                if (_Process.ProcessName == "System" || _Process.ProcessName == "Idle") continue;

                                ProcessList.Add(new
                                {
                                    PID = _Process.Id,
                                    Name = _Process.ProcessName,
                                    Memory = FormatBytes(_Process.WorkingSet64)
                                });
                            }
                            catch (Exception Ex)
                            {
                                Console.WriteLine($"Server > ProcessMonitor error: {Ex.Message}");
                            }
                        }
                        Callback?.Invoke("Process:List", ProcessList);
                        await Task.Delay(1000, Token);
                    }
                }
                catch (TaskCanceledException)
                {
                    Console.WriteLine("Server > ProcessMonitor canceled");
                }
                catch (Exception Ex)
                {
                    Console.WriteLine($"Server > ProcessMonitor error: {Ex.Message}");
                }
            });
        }

        static void StopProcessMonitor()
        {
            ProcessMonitorCTS?.Cancel();
            ProcessMonitorCTS = null;
        }

        static string FormatBytes(long Bytes)
        {
            string[] Sizes = { "B", "KB", "MB", "GB", "TB" };
            double Length = Bytes;
            int Order = 0;
            while (Length >= 1024 && Order < Sizes.Length - 1)
            {
                Order++;
                Length = Length / 1024;
            }
            return $"{Length:0.##} {Sizes[Order]}";
        }

        static void StartApplicationMonitor(Action<string, object> Callback)
        {
            if (ApplicationMonitorCTS != null)
            {
                return;
            }

            ApplicationMonitorCTS = new CancellationTokenSource();
            var Token = ApplicationMonitorCTS.Token;

            Task.Run(async () =>
            {
                try
                {
                    while (!Token.IsCancellationRequested)
                    {
                        var ApplicationList = new List<object>();

                        foreach (var _Process in Process.GetProcesses())
                        {
                            try
                            {
                                if (_Process.Id == 0) continue;
                                if (_Process.ProcessName == "System" || _Process.ProcessName == "Idle") continue;
                                if (String.IsNullOrEmpty(_Process.MainWindowTitle)) continue;
                                ApplicationList.Add(new
                                {
                                    PID = _Process.Id,
                                    Name = _Process.ProcessName,
                                    Title = _Process.MainWindowTitle,
                                    Memory = FormatBytes(_Process.WorkingSet64)
                                });
                            }
                            catch (Exception Ex)
                            {
                                Console.WriteLine($"Server > ProcessMonitor error: {Ex.Message}");
                            }
                        }
                        Callback?.Invoke("Application:List", ApplicationList);
                        await Task.Delay(1000, Token);
                    }
                }
                catch (TaskCanceledException)
                {
                    Console.WriteLine("Server > ApplicationMonitor canceled");
                }
                catch (Exception Ex)
                {
                    Console.WriteLine($"Server > ApplicationMonitor error: {Ex.Message}");
                }
            });
        }

        static void StopApplicationMonitor()
        {
            ApplicationMonitorCTS?.Cancel();
            ApplicationMonitorCTS = null;
        }

        static void ControllerShutDown()
        {
            Process.Start(new ProcessStartInfo("shutdown", "/s /t 0") { CreateNoWindow = true, UseShellExecute = true });
        }

        static void ControllerReboot()
        {
            Process.Start(new ProcessStartInfo("shutdown", "/r /t 0") { CreateNoWindow = true, UseShellExecute = true });
        }

        static void ControllerHibernate()
        {
            NativeMethods.SetSuspendState(true, true, true);
        }

        static void ControllerSleep()
        {
            NativeMethods.SetSuspendState(false, true, true);
        }

        static void ControllerLock()
        {
            NativeMethods.LockWorkStation();
        }

        static class NativeMethods
        {
            [DllImport("user32.dll")]
            public static extern bool LockWorkStation();

            [DllImport("PowrProf.dll", SetLastError = true)]
            [return: MarshalAs(UnmanagedType.Bool)]
            public static extern bool SetSuspendState(bool Hibernate, bool ForceCritical, bool DisableWakeEvent);
        }
    }
}