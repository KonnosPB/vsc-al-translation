page 50100 TestPageExt
{
    PageType = List;
    SourceTable = Integer;

    layout
    {
        area(Content)
        {
            group(Grp1)
            {
                field(Number; Rec.Number)
                {
                    ApplicationArea = All;
                    Caption = 'Number';
                }
            }
        }
    }
    actions
    {
        area(Processing)
        {
            action(DummyAction)
            {
                Caption = 'Dummy Action';
                Image = LineDescription;

                trigger OnAction()
                begin
                    Page.RunModal(0, Rec);
                end;
            }
        }
    }

    var
        MsgLbl: Label 'App published: Hello world';

    trigger OnOpenPage();
    begin
        Message(MsgLbl);
        Rec.SetRange(Number, 1, 10);
    end;

    procedure AnalysisDemo1()
    var
        IntegerLoc: Record Integer;
    begin
        IntegerLoc.Reset();
        IntegerLoc.SetRange(Number, 1, 5);
        if IntegerLoc.Findset then begin
            repeat
            until IntegerLoc.Next() = 0;
        end;
    end;

    local procedure AnalysisDemo2()
    var
        IntLoc: Record Integer;
    begin
        IntLoc.Reset();
        IntLoc.SetRange(Number, 1, 5);
        if IntLoc.Findset then begin
            repeat
            until IntLoc.Next() = 0;
        end;
    end;


}