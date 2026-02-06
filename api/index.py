from app import app

# Vercel serverless function entry point
# It expects a variable named 'app'
if __name__ == "__main__":
    app.run()