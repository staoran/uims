object Card: TCard
  Left = 276
  Top = 112
  BorderStyle = bsNone
  Caption = #30913#21345#32467#31639
  ClientHeight = 134
  ClientWidth = 418
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  KeyPreview = True
  OldCreateOrder = False
  Position = poDesktopCenter
  OnActivate = FormActivate
  OnKeyDown = FormKeyDown
  PixelsPerInch = 96
  TextHeight = 13
  object Panel2: TPanel
    Left = 0
    Top = 41
    Width = 418
    Height = 93
    Align = alClient
    BevelInner = bvLowered
    Color = clBlack
    TabOrder = 0
    object Label4: TLabel
      Left = 43
      Top = 31
      Width = 105
      Height = 29
      Caption = #35831#21047#21345':'
      Font.Charset = GB2312_CHARSET
      Font.Color = clWhite
      Font.Height = -29
      Font.Name = #20223#23435'_GB2312'
      Font.Style = []
      ParentFont = False
    end
    object RzEdit1: TRzEdit
      Left = 147
      Top = 25
      Width = 227
      Height = 41
      Color = clBlack
      Ctl3D = True
      DisabledColor = clBlack
      Font.Charset = ANSI_CHARSET
      Font.Color = clWhite
      Font.Height = -29
      Font.Name = 'Arial'
      Font.Style = []
      FrameColor = clWhite
      FrameVisible = True
      ParentCtl3D = False
      ParentFont = False
      TabOrder = 0
      OnKeyDown = RzEdit1KeyDown
    end
  end
  object Panel1: TPanel
    Left = 0
    Top = 0
    Width = 418
    Height = 41
    Align = alTop
    BevelInner = bvLowered
    Caption = #30913#12288#21345#12288#32467#12288#31639
    Color = clBlack
    Font.Charset = GB2312_CHARSET
    Font.Color = clWhite
    Font.Height = -29
    Font.Name = #20223#23435'_GB2312'
    Font.Style = []
    ParentFont = False
    TabOrder = 1
    object RzFormShape1: TRzFormShape
      Left = 2
      Top = 2
      Width = 414
      Height = 37
    end
  end
  object ADOQuery1: TADOQuery
    Connection = Main.ADOConnection1
    Parameters = <>
    Left = 8
    Top = 8
  end
  object ADOQuery2: TADOQuery
    Connection = Main.ADOConnection1
    Parameters = <>
    Left = 8
    Top = 40
  end
end