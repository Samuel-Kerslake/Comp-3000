var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseStaticFiles();                // Serve wwwroot files
app.MapFallbackToFile("index.html"); // Auto-serve index.html

app.Run();